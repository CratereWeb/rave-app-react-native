import { StyleSheet, Text, View, Button, ToastAndroid } from 'react-native';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';

import * as FileSystem from 'expo-file-system';
import { useDispatch, useSelector } from 'react-redux';

import { setFilePath, setDuration } from '../slices/audioRecordSlice';


/*
?   Cette vue permet d’enregistrer des clips audios et de les stocker dans le téléphone. 
?       Elle devra contenir :
?           -   Un bouton pour commencer et terminer l’enregistrement
?           -   Une lecture play/pause de cet enregistrement
?           -   Un bouton pour sauver l’enregistrement (en lui donnant un nom). 
?           -   Un affichage des enregistrements déjà effectués (de type FlatList ou autre), avec la possibilité de supprimer ou de réécouter les enregistrements. 
?   
?   Pour la lecture et l’enregistrement audio, il est recommandé d’utiliser la librairie expo : https://docs.expo.dev/versions/latest/sdk/audio/
?   Pour la gestion des fichiers : https://docs.expo.dev/versions/latest/sdk/filesystem/
*/

export default function Record({ navigation, route }) {

    //? States locaux du composant & de la vue 'RECORD'
    const [isRecorded, setIsRecorded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [recording, setRecording] = useState({});
    const [recordTitle, setRecordTitle] = useState("myrecord");
    const [recordDuration, setRecordDuration] = useState(0);

    const [playedAudio, setPlayedAudio] = useState(new Audio.Sound());

    const [newFilePath, setNewFilePath] = useState("");

    //? Variables & constantes
    const saveDirectory = FileSystem.documentDirectory + 'records/';

    //? Store : 
    const dispatch = useDispatch();
    //?     - Adresse IP & port de connexion au serveur
    // const serverConnectionIPSelector = useSelector(state => state.serverConnection.ip);
    // const serverConnectionPortSelector = useSelector(state => state.serverConnection.port);
    //?     - Chemin vers le répertoire du fichier sauvegardé
    const audioRecordFilePathSelector = useSelector(state => state.audioRecord.filepath);


    useEffect(() => {
        if (recording.hasOwnProperty("_options")) {
            setNewFilePath(saveDirectory + `${recordTitle}${recording._options.android.extension}`);
        }
    }, [isRecorded]);



    async function onPressRecordButton() {

        setIsSaved(false); // Permet que le futur enregistrement puisse être sauvegardé

        if (isRecording) {

            console.log("Fin de l'enregistrement.");
            setIsRecording(false); //? Fin de la prise de son
            stopRecording();

            showToastWithGravityAndOffset(`Son enregistré.`);
            setIsRecorded(true); //? Le son est enregistré

        }
        else 
        {

            setIsRecorded(false); //? Le son n'est pas enregistré
            console.log("Lancement d'un nouvel enregistrement...");
            setIsRecording(true); //? Début de la prise de son
            startRecording(); //* Prise du son en entrée

        }
    }

    async function onPressPlayButton() {

        const recordingFilePath = isSaved ? newFilePath : recording._uri;

        if (isPlaying) {
            console.log("Interruption de la lecture de l'enregistrement.");
            await playedAudio.stopAsync();
            await playedAudio.unloadAsync();

        }
        else {
            console.log("Chemin du fichier temporaire :", recording._uri);
            console.log("Lecture de l'enregistrement...");

            await playedAudio.loadAsync({
                uri: recordingFilePath,
            });
            await playedAudio.playAsync();
        }

        setIsPlaying(!isPlaying);

    }


    function fromSecondsToHMS(seconds) {
        return new Date(seconds * 1000).toISOString().slice(11, 19);
    }

    const showToastWithGravityAndOffset = (message) => {
        ToastAndroid.showWithGravityAndOffset(
            message,
            ToastAndroid.LONG,
            ToastAndroid.BOTTOM,
            25,
            50,
        );
    }

    async function startRecording() {

        try {
            console.log("Obtention des permissions pour enregistrer l'audio...");

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
        }
        catch (err) {
            console.error("Permission non-accordée : Impossible de débuter l'enregistrement.", err);
            showToastWithGravityAndOffset("Impossible de débuter l'enregistrement sans permission.");
        }
        finally {

            console.log("Début de l'enregistrement...");
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
        }

    }

    async function stopRecording() {
        console.log("Enregistrement terminé.");
        setIsRecorded(false);

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        console.log("L'audio enregistré est dans un fichier temporaire au chemin :", recording._uri);

    }

    async function onPressSaveButton() {
        if (isRecorded) {
            console.log("Sauvegarde de l'enregistrement...");
            saveRecord();

        }
        else {
            console.error("Aucun son n'est enregistré.");
            showToastWithGravityAndOffset("Aucun son n'est enregistré.");
        }


    }

    async function saveRecord() {
        await FileSystem.makeDirectoryAsync(saveDirectory, {
            intermediates: true
        }); //* Crée le répertoire qui accueille les enregistrements dans le système de fichiers Expo
        await FileSystem.moveAsync({
            from: recording._uri,
            to: newFilePath,
        }); //* Déplace le fichier temporaire vers un chemin définitif dans le système de fichiers Expo

        console.log(`Enregistrement sauvegardé : ${newFilePath}`);
        showToastWithGravityAndOffset(`Enregistrement sauvegardé : ${recordTitle}${recording._options.android.extension}`);

        setIsSaved(true);

        //~ Ajouter le chemin du fichier enregistré au Redux Store de l'application
        updateAudioRecordState(newFilePath);
    }

    function updateAudioRecordState(newFilePath) {
        dispatch(setFilePath(newFilePath));
        dispatch(setDuration(recording._finalDurationMillis));
    }


    return (
        <View>
            <View style={styles.view}>
                <View style={styles.buttonView} >
                    <Ionicons
                        name={isRecording ? "stop-circle-outline" : "mic-circle-outline"}
                        size={64}
                        onPress={onPressRecordButton}
                        color={isRecording ? "#ff0000" : "#000000"}
                        disabled={isPlaying}
                    />
                    <Text
                        style={isRecording ? { color: 'red' } : { color: 'black' }}

                    >
                        {isRecording ? "Parlez pour enregistrer" : "Cliquez pour lancer l'enregistrement"}
                    </Text>
                </View>
                {isRecorded
                    && <View style={styles.recordView}>
                        <Text style={styles.recordTitle}>{recordTitle}{recording._options.android.extension}</Text>
                        <Text style={styles.recordDuration}>{fromSecondsToHMS(recording._finalDurationMillis / 1000)}</Text>
                    </View>
                }
                {isRecorded
                    && <View style={styles.buttonView}>
                        <Ionicons
                            name={isPlaying ? "stop-circle-outline" : "play-circle-outline"}
                            size={64}
                            onPress={onPressPlayButton}
                            color={isPlaying ? "#0000ff" : "#000000"}
                            disabled={isRecording}
                        />
                        <View>
                            <View style={styles.recordPlayer}>
                                <Text>00:00:00</Text>
                                <Text>/</Text>
                                <Text>{fromSecondsToHMS(recording._finalDurationMillis / 1000)}</Text>
                            </View>
                            <Text style={{ color: 'grey' }}>{recordTitle}{recording._options.android.extension}</Text>
                        </View>
                    </View>
                }
                {isRecorded
                    && <View style={styles.buttonView}>
                        <Ionicons
                            name="save-outline"
                            size={64}
                            onPress={onPressSaveButton}
                            color={isSaved ? "#aaaaaa" : "#000000"}
                            disabled={isSaved}
                        />
                        <Text
                            style={isSaved ? { color: '#aaaaaa' } : { color: '#000000' }}
                        >Sauvegarder l'enregistrement</Text>
                    </View>
                }

            </View>

        </View>
    )
}


const styles = StyleSheet.create({
    viewTitle: {
        marginBottom: 16,
    },
    view: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    buttonView: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordView: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        backgroundColor: 'lightblue',
        color: 'darkskyblue',
    },
    recordTitle: {
        textAlign: 'center',
    },
    recordDuration: {

    },
    recordPlayer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        gap: 16,

    }
})