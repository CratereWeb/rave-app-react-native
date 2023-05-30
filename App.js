import { StatusBar } from 'expo-status-bar';
// import * as React from 'react';

import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import Home from './components/Home';
import Record from './components/Record';
import Rave from './components/Rave';
import { store } from './store';

import { Provider } from 'react-redux';

/*
? CONSIGNES GENERALES
!    -  L’ensemble des variables/callbacks partagés entre les différentes vues devront être gérées avec un Store de type Redux
?    -  Seules les variables utilisées uniquement par les composants seront donc gérées avec useState.
?    -  Les enregistrements effectués dans la vue records devront être sauvegardées de façon à être retrouvées à l’ouverture de l’application (avec donc des fichiers en mémoire, et un state qui conserve le lien vers leur emplacement sauvé via le store redux-persist par exemple). Pour les enregistrements audio, ils devront être copiés du cache vers le dossier de stockage persistant de l’app.  
?    -  La navigation se fera entre les vues en swipant (avec des Tabs react-navigation)
*/

/* 
~ REDUX STORE
~     - Adresse & Port du serveur distant
~     - URI du fichier enregistré  
*/

export default function App() {

  const Tab = createMaterialTopTabNavigator();

  return (

    <Provider store={store}>
      <NavigationContainer style={styles.container}>
        <Tab.Navigator style={styles.tabnav}>
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Record" component={Record} />
          <Tab.Screen name="Rave" component={Rave} />
        </Tab.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabnav: {
    top: 32,
  }
});
