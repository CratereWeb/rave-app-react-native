import { StyleSheet, Text, View, TextInput, Button, ToastAndroid } from 'react-native';
import { useState, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { setIP, setPort, setFullAddress } from '../slices/serverConnectionSlice';

/*
?    Cette vue permet d’entrer les informations du serveur et de s’y connecter
?        Elle devra contenir :
?        -      Une entrée utilisateur pour l’adresse IP
?        -      Une entrée pour le port 
?        -      Un bouton qui permet de tester la connexion en envoyant une requête au serveur.
?               L’application devra notifier l’utilisateur via un toast ou un message. 
*/

export default function Home({ navigation }) {
    //? States locaux du composant & de la vue 'HOME'
    const [textIP, onChangeTextIP] = useState("");
    const [textPort, onChangeTextPort] = useState("");
    const [isConnected, setConnected] = useState(false);
    const [hasBeenTested, setHasBeenTested] = useState(false);


    //? Store
    const dispatch = useDispatch();
    //?     - Adresse IP & port de connexion au serveur
    const serverConnectionIPSelector = useSelector(state => state.serverConnection.ip);
    const serverConnectionPortSelector = useSelector(state => state.serverConnection.port);





    async function onPressTestConnection() {
        const [ip, port] = [textIP.trim(), textPort.trim()];

        console.log(`IP : ${ip} | PORT : ${port}`);
        console.log("Test de la connexion...");


        const response = await fetch(`http://${ip}:${port}/`);

        if (response.status == 200) {
            const textData = await response.text();
            console.log(textData);
            setConnected(true);
            showToastWithGravityAndOffset(`La connexion à ${ip}:${port} fonctionne.`);

            updateServerConnectionState(ip, port);

            return true;

        }
        else {
            console.log("La connexion a échoué.");
            showToastWithGravityAndOffset(`La connexion à ${ip}:${port} a échoué.`)
            setConnected(false);
            return false;

        }

    }

    useEffect(() => {
        setConnected(false);
        setHasBeenTested(false);
    }, [textIP, textPort]);


    function updateServerConnectionState(ip, port) {
        dispatch(setIP(ip));
        dispatch(setPort(port));
        console.log(serverConnectionIPSelector);
        console.log(serverConnectionPortSelector);
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

    return (
        <View>
            {isConnected
                && <View>
                    <Text
                        style={styles.successMessage}
                    >Vous êtes connecté à {textIP}:{textPort}</Text>
                </View>
            }
            <View
                style={styles.view}
            >
                <View>
                    <Text>Adresse IP</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={onChangeTextIP}
                        value={textIP}
                        placeholder='127.0.0.1'
                    />
                </View>
                <View>
                    <Text>Port</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={onChangeTextPort}
                        value={textPort}
                        placeholder='80, 8000, 8001, ...'
                    />
                </View>
                <Button
                    onPress={onPressTestConnection}
                    title="Tester la connexion"
                />
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    view: {
        display: 'flex',
        justifyContent: 'flex-start',
        gap: 32,
        flexDirection: 'column',
        padding: 32,

    },
    input: {
        borderWidth: 1,
        borderColor: 'grey',
        height: 48,
        padding: 8,
    },
    successMessage: {
        color: 'white',
        backgroundColor: 'green',
        textAlign: 'center',
        padding: 4
    },
    errorMessage: {
        color: 'red'
    }
});