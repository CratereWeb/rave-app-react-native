import { StyleSheet, Text, View, Image, Button, ToastAndroid } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';



/*
?   Cette vue permet de sélectionner un clip audio, de l’envoyer au serveur, de télécharger le résultat puis de l’écouter. 
?   
?   Elle devra contenir :
?       -   Un système de vue (Tab par exemple) permettant de choisir entre : 
?               -   Charger un son par défaut (stocké dans les assets de l’application) 
?               -   Sélectionner un clip parmi les enregistrements de la vue « Record »
?               -   Sélectionner un son dans les fichiers du téléphone (de la musique par exemple)
?               -   Une solution pour afficher des tabs dans une seule et même vue : https://github.com/satya164/react-native-tab-view
?   
?       -   Un bouton pour envoyer le clip au serveur. Un widget indiquera que le modèle est en train de calculer (par ex: https://reactnative.dev/docs/activityindicator). Lorsque le calcul est terminé, le son transformé sera téléchargé automatiquement
?   
?       -   Deux boutons pour lire le fichier audio original et le transformé. 
*/

export default function Rave() {


    //? States locaux du composant & de la vue 'RAVE'
    const [modelsData, setModelsData] = useState(null);
    const [optionsAreReady, setOptionsAreReady] = useState(false);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedAudio, setSelectedAudio] = useState('');
    const [isTaskLoading, setIsTaskLoading] = useState(false);
    const [isTaskFinished, setIsTaskFinished] = useState(false);
    const [outputURI, setOutputURI] = useState(null);
    const [isOutputFileDownloaded, setIsOutputFileDownloaded] = useState(false);
    const [playedAudio, setPlayedAudio] = useState(new Audio.Sound());
    const [isOutputFilePlaying, setIsOutputFilePlaying] = useState(false);
    const [outputFileName, setOutputFileName] = useState("");



    //? Store : 
    const dispatch = useDispatch();
    //?     - Adresse IP & port de connexion au serveur
    const serverConnectionIPSelector = useSelector(state => state.serverConnection.ip);
    const serverConnectionPortSelector = useSelector(state => state.serverConnection.port);
    //?     - Chemin vers le répertoire du fichier sauvegardé
    const audioRecordFilePathSelector = useSelector(state => state.audioRecord.filepath);
    const audioRecordDurationSelector = useSelector(state => state.audioRecord.duration);


    if (modelsData == null) {
        console.log("Acquision des modèles via le serveur...");
        fetch(`http://${serverConnectionIPSelector}:${serverConnectionPortSelector}/getmodels`)
            .then(res => res.json())
            .then(jsonData => {
                console.log(jsonData['models']);
                setModelsData(jsonData['models']);
            }
        );
        console.log("Les modèles ont été chargées dans l'application.");
    }

    const audioSourceFiles = [
        audioRecordFilePathSelector
    ];

    useEffect(() => {
        if (selectedAudio !== '' && selectedModel !== '') {
            setOptionsAreReady(true);
        }
    }, [selectedAudio, selectedModel]);


    function onPressSubmitButton() {
        const params = {
            ip: serverConnectionIPSelector,
            port: serverConnectionPortSelector,
            audioFilePath: selectedAudio,
            model: selectedModel,
        };

        uploadTask(params);
    }

    async function uploadTask(params) {
        console.log(`Lancement du traitement :`, params);
        setIsTaskLoading(true);

        let { ip, port, audioFilePath, model } = params;

        await setServerModel(ip, port, model);
        await setServerAudio(ip, port, audioFilePath);

        setIsTaskLoading(false);
        setIsTaskFinished(true);


        console.log("Traitement terminé");
        showToastWithGravityAndOffset("Traitement terminé.");

        setIsOutputFileDownloaded(false);

    }



    async function setServerModel(ip, port, model) {
        await fetch(`http://${ip}:${port}/selectModel/${model}`);
        console.log("Le serveur a bien pris compte du choix du modèle :", model);
    }

    async function setServerAudio(ip, port, audioFilePath) {
        let serverAddress = `http://${ip}:${port}`;
        let response = await FileSystem.uploadAsync(serverAddress + "/upload", audioFilePath, {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: { filename: audioFilePath }
        })
        console.log("Le serveur a bien pris compte du choix de l'audio :", response.body);

    }


    async function onPressDownloadButton() {
        console.log(`Téléchargement du fichier...`);

        let [ip, port, audioFilePath] = [serverConnectionIPSelector, serverConnectionPortSelector, audioRecordFilePathSelector];
        await downloadOutputFile(ip, port, audioFilePath, selectedModel.split('.onnx')[0]);


    }

    async function downloadOutputFile(ip, port, audioFilePath, model) {
        let outputDirectory = FileSystem.documentDirectory + "output";
        await FileSystem.makeDirectoryAsync(outputDirectory, {
            intermediates: true,
        });

        let serverAddress = `http://${ip}:${port}`;
        let sourceFileName = audioFilePath.split('/')[audioFilePath.split('/').length - 1].split('.m4a')[0];


        setOutputFileName(`${sourceFileName}-${model}-${dateForFileName()}.wav`);

        const { uri } = await FileSystem.downloadAsync(
            serverAddress + "/download",
            outputDirectory + '/' + outputFileName
        );
        setOutputURI(uri);

        setIsOutputFileDownloaded(true);
        showToastWithGravityAndOffset("Fichier téléchargé.");

    }

    const dateForFileName = () => {
        let date = new Date();
        return `${date.getFullYear()}${date.getMonth()}${date.getDay()}-${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
    }

    async function onPressPlayButton() {
        if (isOutputFilePlaying) {
            console.log("Interruption de la lecture de l'enregistrement.");
            await playedAudio.stopAsync();
            await playedAudio.unloadAsync();
        }
        else {
            await playedAudio.unloadAsync();

            console.log("Chemin du fichier temporaire :", outputURI);
            console.log("Lecture de l'enregistrement...");

            await playedAudio.loadAsync({
                uri: outputURI,
            });
            await playedAudio.playAsync();
        }

        setIsOutputFilePlaying(!isOutputFilePlaying);

        console.log(playedAudio);
    }



    function fromSecondsToHMS(seconds) {
        return new Date(seconds * 1000).toISOString().slice(11, 19);
    }


    const showToastWithGravityAndOffset = (message) => {
        ToastAndroid.showWithGravityAndOffset(
            message,
            ToastAndroid.LONG,
            ToastAndroid.TOP,
            25,
            50,
        );
    }




    return (
        <View>
            <Text style={styles.title}>Rave</Text>
            <Image
                source={{ uri: "https://caillonantoine.github.io/ravejs/rave_cropped.png" }}
            />
            <View style={styles.view}>
                <View style={styles.subview}>
                    <Text style={styles.subtitle}>Choix du fichier audio</Text>
                    <SelectDropdown
                        buttonStyle={styles.selectDropdown.button}
                        buttonTextStyle={styles.selectDropdown.buttonText}

                        data={audioSourceFiles}
                        onSelect={(selectedItem, index) => {
                            console.log("Audio sélectionné :", selectedItem);
                            setSelectedAudio(selectedItem);
                        }}
                        buttonTextAfterSelection={(item, index) => item.split('/')[item.split('/').length - 1]}
                        rowTextForSelection={(item, index) => item.split('/')[item.split('/').length - 1]}
                    />

                </View>
                <View style={styles.subview}>
                    <Text style={styles.subtitle}>Choix du modèle</Text>
                    <SelectDropdown
                        buttonStyle={styles.selectDropdown.button}
                        buttonTextStyle={styles.selectDropdown.buttonText}
                        data={modelsData}
                        onSelect={(selectedItem, index) => {
                            console.log("Modèle sélectionné :", selectedItem);
                            setSelectedModel(selectedItem);
                        }}
                        buttonTextAfterSelection={(item, index) => item.charAt(0).toUpperCase() + item.slice(1).split('.onnx')[0]}
                        rowTextForSelection={(item, index) => item.charAt(0).toUpperCase() + item.slice(1).split('.onnx')[0]}
                    />
                </View>
                <View style={styles.submitButtonView}>
                    <Button
                        disabled={!optionsAreReady}
                        title={isTaskFinished ? "Lancer un nouveau traitement" : "Lancer le traitement"}
                        onPress={onPressSubmitButton}
                    />
                </View>
                {isTaskLoading
                    && <View>
                        <Text>Traitement en cours...</Text>
                    </View>
                }
                {isTaskFinished && !isTaskLoading && !isOutputFileDownloaded
                    && <View>
                        <Button
                            disabled={!isTaskFinished}
                            title="Télécharger le fichier"
                            onPress={onPressDownloadButton}
                        />
                    </View>
                }
                {isOutputFileDownloaded
                    && <View>
                        <Text style={styles.outputFileName}>{outputFileName}</Text>
                        <View style={styles.recordPlayer}>
                            <Ionicons
                                name={isOutputFilePlaying ? "stop-circle-outline" : "play-circle-outline"}
                                size={64}
                                onPress={onPressPlayButton}
                                color={isOutputFilePlaying ? "#0000ff" : "#000000"}
                            />
                            <View style={styles.recordTimer}>
                                <Text>00:00:00</Text>
                                <Text>/</Text>
                                <Text>{fromSecondsToHMS(audioRecordDurationSelector / 1000)}</Text>
                            </View>
                        </View>
                    </View>
                }
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    title: {
        fontSize: 32,
        textAlign: "center",
        marginBottom: 64,
    },
    view: {
        display: 'flex',
        gap: 72,
        justifyContent: 'center',
    },
    subview: {
        display: 'flex',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 24,
    },
    selectDropdown: {
        button: {
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#434343',
            backgroundColor: '#efefef'
        },
        buttonText: {
            color: '#434343',
        }
    },
    submitButtonView: {
        marginTop: 8,
    },
    outputFileName: {
        backgroundColor: '#26A65B',
        color: 'darkskyblue',
        textAlign: 'center',
    },
    recordPlayer: {
        display: 'flex',
        flexDirection: 'row',
    },
    recordTimer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    }
})