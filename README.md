# MMM-Transilien

Local transport in Ile de France Region module for MagicMirror², a projet created by [Michael Teeuw](https://github.com/MichMich/MagicMirror)

This module is working thanks to lgmorand and flafla15
It gives in real time next train (transilien) of the station of your choice using SNCF API "temps réel transilien"

## SNCF OpenData

A law was voted to force public companies to open some of their data to the public.
More info about the [api](https://ressources.data.sncf.com/explore/dataset/api-temps-reel-transilien/)

**VERY IMPORTANT**
They sucks at RATP and they force you to ask for a key to use the API. For that, you need to ask them a key by email (see link above), once you write a mail, you MAY receive a key after several days or weeks (because they really really suck...). It may change in the future but for now they clearly do that to prevent user to easily access to their API.

## Installation

Clone the git in the /modules folder of Magic Mirror and run the "npm install" command which will installed the required node modules


## Configuration

1- You need to find your train station and find the **UIC** of the train station (*not the uic7 column, the UIC*). You can look [here](https://ressources.data.sncf.com/explore/dataset/sncf-gares-et-arrets-transilien-ile-de-france/table/?sort=libelle)

2- Specify missing values in the configuration. You need the UIC of your train station and the UIC of the arrival station. *depart* and *arrivee* are the name displayed on the widget (in the title)

```javascript
{
    module: 'MMM-Transilien',
    position: 'top_right',
    config:{
        depart:"Courbevoie", // name of the current station
        departUIC:"87382200",
        arrivee:"St Lazare", // name of the destination
        arriveeUIC:"87384008",
        login:"",
        password:""
    }
},
```

3- Don't forget to add login/password, which are the credentials to access the API. You can try them in your browser by trying to open the url [http://api.transilien.com/](http://api.transilien.com/)

## Screenshot

![demo](https://raw.githubusercontent.com/lgmorand/MMM-Transilien/master/screenshots/transilien.png)

## Further information and support

Please use the forum of magic mirror² https://forum.magicmirror.builders/