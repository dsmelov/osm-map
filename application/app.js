$(document).ready(function() {


    //Global lets
    let step = 0.001;
    let current_lng = 0;
    let current_lat = 0;
    let current_alt = 0;
    let accuracy = 0;
    let altitude = 0;



    let zoom_level = 18;
    let current_zoom_level = 18;
    let new_lat = 0;
    let new_lng = 0;
    let curPos = 0;
    let myMarker = "";
    let i = 0;
    let map_or_track;
    let windowOpen = "map";
    let message_body = "";
    let openweather_api = "";
    let default_position_lat = "";
    let default_position_long = "";
    let tabIndex = 0;
    let debug = "false";

    let tilesLayer;
    let tileLayer;
    let myLayer;
    let tilesUrl;
    let state_geoloc = "not-activ";






    //remove leaflet attribution to have more space
    $('.leaflet-control-attribution').hide();

    //welcome message
    $('div#message div').text("Welcome");
    setTimeout(function() {
        $('div#message').css("display", "none")
        getLocation("init");
        ///set default map
        opentopo_map();
        windowOpen = "map";

    }, 4000);


    //leaflet add basic map
    let map = L.map('map-container', {
        zoomControl: false,
        dragging: false,
        keyboard: true
    }).fitWorld();

    L.control.scale({ position: 'topright', metric: true, imperial: false }).addTo(map);


    ////////////////////
    ////MAPS////////////
    ///////////////////

    function toner_map() {
        tilesUrl = 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);

    }

    function opentopo_map() {
        tilesUrl = 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy;<div> © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)</div>'
        });

        map.addLayer(tilesLayer);

        setTimeout(function() {
            $('.leaflet-control-attribution').hide()
        }, 4000);

    }


    function owm_map() {

        tilesUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + openweather_api;
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);
    }



    function osm_map() {
        tilesUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);

    }




    //rain layer
    /////////
    // from assets/js/rainlayer.js

    /////////////////////////
    //get Openweather Api Key
    /////////////////////////
    function read_json(option) {

        rain_layer_animation_stop()
        $("div#tracks").empty();
        $("div#maps").empty();
        $("div#layers").empty();
        $("div#markers").empty();


        let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
        finder.search("osm-map.json");


        finder.on("empty", function(needle) {
            toaster("no sdcard found");
            return;
        });

        finder.on("searchComplete", function(needle, filematchcount) {


            if (filematchcount == 0) {
                toaster("no osm-map.json found");
                return;
            }
        })

        finder.on("fileFound", function(file, fileinfo, storageName) {


            $("div#maps").append('<div class="items" data-map="toner">Toner <i>Map</i></div>');
            $("div#maps").append('<div class="items" data-map="osm">OSM <i>Map</i></div>');
            $("div#maps").append('<div class="items" data-map="otm">OpenTopo <i>Map</i></div>');
            $("div#layers").append('<div class="items" data-map="rain">Rain</div>');

            let markers_file = "";
            let reader = new FileReader()


            reader.onerror = function(event) {
                alert('shit happens')
                reader.abort();
            };

            reader.onloadend = function(event) {



                let data;
                //check if json valid
                try {
                    data = JSON.parse(event.target.result);
                } catch (e) {
                    toaster("Json is not valid")
                    return false;
                }



                //add markers and openweatermap
                $.each(data, function(index, value) {

                    if (value.markers) {
                        $.each(value.markers, function(index, item) {
                            $("div#markers").append('<div class="items" data-map="marker" data-lat="' + item.lat + '" data-lng="' + item.lng + '">' + item.marker_name + '</div>');
                        })
                    }

                    if (value.api_key) {
                        openweather_api = value.api_key;
                        $("div#maps").append('<div class="items" data-map="owm">Open Weather <i>Map</i></div>');

                    }


                })



                if (option == "finder") {

                    windowOpen = "finder";
                    let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
                    finder.search(".geojson");

                    finder.on("searchComplete", function(needle, filematchcount) {


                        //set tabindex
                        $('div.items').each(function(index, value) {
                            let $div = $(this)
                            $div.attr("tabindex", index);
                        });


                        $('div#finder').css('display', 'block');
                        $('div#finder').find('div.items[tabindex=0]').focus();
                        tabIndex = 0;

                    });


                    finder.on("fileFound", function(file, fileinfo, storageName) {
                        $("div#tracks").append('<div class="items" data-map="geojson">' + fileinfo.name + '</div>');
                    });

                }

            };
            reader.readAsText(file)
        });
    }
    read_json()








    ////////////////////
    ////GEOLOCATION/////
    ///////////////////
    //////////////////////////
    ////MARKER SET AND UPDATE/////////
    /////////////////////////



    function getLocation(option) {

        if (option != "delete_marker") {
            toaster("seeking position");
        }

        let options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        function success(pos) {
            let crd = pos.coords;


            current_lat = crd.latitude;
            current_lng = crd.longitude;
            current_alt = crd.altitude;
            current_heading = crd.heading;



            if (option == "save_marker" || option == "delete_marker") {


                let sdcard = navigator.getDeviceStorages("sdcard");
                let filename = moment().format("DD.MM.YYYY, HH:MM");



                let request = sdcard[1].get("osm-map/osm-map.json");

                request.onsuccess = function() {

                    let fileget = this.result;
                    let reader = new FileReader();

                    reader.addEventListener("loadend", function(event) {


                        let data;
                        //check if json valid
                        try {
                            data = JSON.parse(event.target.result);
                        } catch (e) {
                            toaster("Json is not valid")
                            return false;
                        }

                        if (option == "save_marker") {
                            data[0].markers.push({ "marker_name": filename, "lat": current_lat, "lng": current_lng });
                        }

                        if (option == "delete_marker") {
                            var markers = [];

                            $.each(data[0].markers, function(index, value) {
                                if (value.marker_name != $(document.activeElement).text()) {
                                    markers.push(value);
                                }

                            })
                            data[0].markers = markers;




                        }


                        let extData = JSON.stringify(data);

                        deleteFile(1, "osm-map/osm-map.json", "")


                        setTimeout(function() {

                            let file = new Blob([extData], { type: "application/json" });
                            let requestAdd = sdcard[1].addNamed(file, "osm-map/osm-map.json");

                            requestAdd.onsuccess = function() {
                                if (option == "delete_marker") {
                                    toaster('Marker deleted');
                                    document.activeElement.style.display = "none";
                                    //set tabindex
                                    $('div.items').each(function(index, value) {
                                        let $div = $(this)
                                        $div.attr("tabindex", index);
                                    });
                                    $('div#finder').find('div.items[tabindex=0]').focus();
                                    tabIndex = 0;

                                }
                                if (option == "save_marker") {
                                    toaster('Marker saved');
                                    L.marker([current_lat, current_lng]).addTo(map);
                                    map.setView([current_lat, current_lng], 13);

                                    $('div#finder').css('display', 'none');
                                    windowOpen = "map";
                                }


                            }

                            requestAdd.onerror = function() {
                                toaster('Unable to write the file: ' + this.error);
                            }


                        }, 2000);

                    })
                    reader.readAsText(fileget);
                }
            }


            if (option == "share") {
                share_position()

            }

            if (option == "init") {

                myMarker = L.marker([current_lat, current_lng]).addTo(map);
                map.setView([current_lat, current_lng], 13);
                zoom_speed();
                $('div#message div').text("");

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + altitude.toFixed(5));
                return false;
            }

            if (option == "updateMarker") {

                myMarker.setLatLng([current_lat, current_lng]).update();
                map.flyTo(new L.LatLng(current_lat, current_lng), 16);
                zoom_speed()

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + current_alt);
                $('div#coordinations div#heading').text("heading " + current_heading);

            }

        }


        function error(err) {
            toaster("Position not found");
        }


        navigator.geolocation.getCurrentPosition(success, error, options);

    }


    function geolocationWatch() {
        let watchID;
        let geoLoc = navigator.geolocation;
        let state;


        if (state_geoloc == "not-activ") {

            function showLocation(position) {
                let crd = position.coords;

                current_lat = crd.latitude;
                current_lng = crd.longitude;
                current_alt = crd.altitude;
                current_heading = crd.heading;


                map.flyTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
                myMarker.setLatLng([current_lat, current_lng]).update();

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + current_alt);
                $('div#coordinations div#heading').text("heading " + current_heading);


                state_geoloc = "activ";


            }

            function errorHandler(err) {
                if (err.code == 1) {
                    toaster("Error: Access is denied!");
                } else if (err.code == 2) {
                    toaster("Error: Position is unavailable!");
                }
            }


            if (navigator.geolocation) {

                let options = { timeout: 60000 };
                watchID = geoLoc.watchPosition(showLocation, errorHandler, options);
                toaster("watching postion started");
            } else {
                toaster("Sorry, browser does not support geolocation!");
            }
        }



        if (state_geoloc == "activ") {
            geoLoc.clearWatch(watchID);
            state_geoloc = "not-activ";
            toaster("watching postion stopped");

        }

    }






    ///////////////////////////////
    ////send current position by sms
    ///////////////////////////////

    function share_position() {

        message_body = "https://www.openstreetmap.org/?mlat=" + current_lat + "&mlon=" + current_lng + "&zoom=14#map=14/" + current_lat + "/" + current_lng;

        let sms = new MozActivity({
            name: "new",
            data: {
                type: "websms/sms",
                number: "",
                body: ".." + message_body
            }
        });

    }





    function addMapLayers(param) {
        if ($(".items").is(":focus") && windowOpen == "finder") {

            //switch online maps
            let item_value = $(document.activeElement).data('map');


            if (item_value == "toner") {
                map.removeLayer(tilesLayer);
                remove_rain_overlayers()
                toner_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }


            if (item_value == "osm") {
                remove_rain_overlayers()
                map.removeLayer(tilesLayer);
                osm_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }


            if (item_value == "otm") {
                remove_rain_overlayers()
                map.removeLayer(tilesLayer);
                opentopo_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }

            if (item_value == "rain") {
                map.removeLayer(tilesLayer);
                osm_map();
                rain_layer_animation_start();
                map.setZoom(2);
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }


            if (item_value == "owm") {
                remove_rain_overlayers()
                map.removeLayer(tilesLayer);
                osm_map();
                owm_map();
                $('div#finder').css('display', 'none');
                $("div#output").css("display", "block")
                windowOpen = "map";
            }

            if (item_value == "share") {
                remove_rain_overlayers();
                osm_map();
                getLocation("share")

            }



            if (item_value == "disable-screenlock") {

                $("div.disable-screenlock").css('color', 'silver').css('font-style', 'italic');
                lockScreenDisabler();
                geolocationWatch();
            }




            if (item_value == "update-position") {

                getLocation("update")
            }


            if (item_value == "search") {
                windowOpen = "map";
                $('div#finder').css('display', 'none');
                showSearch();
            }

            if (item_value == "coordinations") {

                coordinations("show")
            }

            if (item_value == "savelocation") {

                getLocation("save_marker");
            }

            if (item_value == "marker") {
                if (param == "add-marker") {
                    current_lng = $(document.activeElement).data('lng');
                    current_lat = $(document.activeElement).data('lat');
                    L.marker([current_lat, current_lng]).addTo(map);
                    map.setView([current_lat, current_lng], 13);
                    $('div#finder').css('display', 'none');
                    windowOpen = "map";

                }

                if (param == "delete-marker") {
                    getLocation("delete_marker")
                }

            }



            //add geoJson data
            if (item_value == "geojson") {
                let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
                finder.search($(document.activeElement).text());


                finder.on("fileFound", function(file, fileinfo, storageName) {
                    //file reader

                    let geojson_data = "";
                    let reader = new FileReader();

                    reader.onerror = function(event) {
                        alert('shit happens')
                        reader.abort();
                    };

                    reader.onloadend = function(event) {

                        if (myLayer) {
                            L.removeLayer(myLayer)
                        }

                        //check if json valid
                        try {
                            geojson_data = JSON.parse(event.target.result);
                        } catch (e) {
                            toaster("Json is not valid")
                            return false;
                        }

                        //if valid add layer
                        $('div#finder div#question').css('opacity', '1');
                        myLayer = L.geoJSON().addTo(map);
                        myLayer.addData(geojson_data);
                        map.setZoom(8);
                        windowOpen = "map";

                    };


                    reader.readAsText(file)

                });
            }


        }

    }
    ////////////////////////////////////////
    ////COORDINATIONS PANEL/////////////////
    ///////////////////////////////////////

    function coordinations(param) {
        if (param == "show") {
            $("div#coordinations").css("display", "block");
            $("div#finder").css("display", "none");
            windowOpen = "coordinations";

        }

        if (param == "hide") {
            $("div#coordinations").css("display", "none");
            windowOpen = "map";
        }
    }



    ////////////////////////////////////////
    ////SCREEN OFF ONLY Nokia8110////////////
    ///////////////////////////////////////




    function screenWakeLock(param1) {
        if (param1 == "lock") {
            lock = window.navigator.requestWakeLock("screen");
        }

        if (param1 == "unlock") {
            if (lock.topic == "screen") {
                lock.unlock();
            }
        }
    }






    function setScreenlockPasscode(state) {


        let lock = navigator.mozSettings.createLock();
        //getting lockscreen setting value on start the app
        // to know how to set the value on the same vaule on 
        //closing the app



        if (state == "get") {
            let setting = lock.get('lockscreen.enabled');
            setting.onsuccess = function() {
                if (setting.result["lockscreen.enabled"] == false) {
                    let lk_state = localStorageWriteRead("lockscreen_state", "disabled");
                }

                if (setting.result["lockscreen.enabled"] == true) {
                    let lk_state = localStorageWriteRead("lockscreen_state", "enabled");
                }
            }
        }




        //set setting
        let result = lock.set({

            'lockscreen.enabled': state

        });


        result.onsuccess = function() {
            //alert("The setting has been changed");
        }

        result.onerror = function() {
            //alert("An error occure, the setting remain unchanged");
        }
    }


    setTimeout(function() {
        setScreenlockPasscode("get")
    }, 4000);



    function lockScreenDisabler() {

        let power = window.navigator.mozPower;

        screenWakeLock("lock");
        setScreenlockPasscode(false);


        function screenLockListener(topic, state) {
            $("div.setting-screenlock").css('color', 'silver').css('font-style', 'italic');
        }
        power.addWakeLockListener(screenLockListener);




    }


    ///////////////////////////////////////
    ////SAVE POSITION AS MARKER////////////
    ///////////////////////////////////////

    function savePosition() {
        getLocation("save_position")
    }





    //////////////////////////
    ////SEARCH BOX////////////
    /////////////////////////


    function formatJSON(rawjson) {
        let json = {},
            key, loc, disp = [];

        for (let i in rawjson) {
            disp = rawjson[i].display_name.split(',');
            key = disp[0] + ', ' + disp[1];
            loc = L.latLng(rawjson[i].lat, rawjson[i].lon);
            json[key] = loc; //key,value format
        }

        return json;
    }

    let mobileOpts = {
        url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
        jsonpParam: 'json_callback',
        formatData: formatJSON,
        textPlaceholder: 'Search...',
        autoType: true,
        tipAutoSubmit: true,
        autoCollapse: true,
        collapsed: false,
        autoCollapseTime: 1000,
        delayType: 800,
        marker: {
            icon: true
        }
    };

    let searchControl = new L.Control.Search(mobileOpts);


    searchControl.on('search:locationfound', function(e) {


        curPos = e.latlng;

        current_lng = curPos.lng;
        current_lat = curPos.lat;

        killSearch()

    })

    map.addControl(searchControl);


    $('.leaflet-control-search').css('display', 'none')



    function showSearch() {
        if ($('.leaflet-control-search').css('display') == 'none' && windowOpen == "map") {

            $('.leaflet-control-search').css('display', 'block');
            setTimeout(function() {
                $('.leaflet-control-search').find("input").focus();
                $('.leaflet-control-search').find("input").val("");
            }, 1000);
            $('div#search').css('display', 'block');

        } else {
            $('.leaflet-control-search').css('display', 'none');
            $('.leaflet-control-search').find("input").val("");

        }
    }


    function killSearch() {

        if ($('.leaflet-control-search').css('display') == 'block') {
            $('div#search').css('display', 'none');
            $('.leaflet-control-search').css('display', 'none');
            $('.leaflet-control-search').find("input").val("");
            $('.leaflet-control-search').find("input").blur();
        }

    }


    /////////////////////
    ////ZOOM MAP/////////
    ////////////////////


    function ZoomMap(in_out) {

        let current_zoom_level = map.getZoom();
        if (windowOpen == "map" && $('.leaflet-control-search').css('display') == 'none') {
            if (in_out == "in") {

                if (windowOpen == "rainmap" && current_zoom_level < 5) {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }


                if (windowOpen == "otm" && current_zoom_level < 16) {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }

                if (windowOpen == "map") {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }



            }

            if (in_out == "out") {
                current_zoom_level = current_zoom_level - 1
                map.setZoom(current_zoom_level);
            }

            zoom_level = current_zoom_level;
            zoom_speed();

        }

    }




    function zoom_speed() {
        if (zoom_level < 6) {
            step = 1;
        }


        if (zoom_level > 6) {
            step = 0.1;
        }


        if (zoom_level > 11) {
            step = 0.001;
        }

        return step;
    }


    function unload_map(trueFalse) {
        if ($("div#finder").css('display') == 'block') {

            if (trueFalse == true) {
                map.removeLayer(tilesLayer);
                $('div#finder').css('display', 'none');
                $('div#finder div#question').css('opacity', '0');
                windowOpen = "map";
            }

            if (trueFalse == false) {
                $('div#finder').css('display', 'none');
                $('div#finder div#question').css('opacity', '0');
                windowOpen = "map";
            }
        }
    }


    /////////////////////
    //MAP NAVIGATION//
    /////////////////////


    function MovemMap(direction) {
        if (windowOpen == "map") {
            if (direction == "left") {
                zoom_speed()

                current_lng = current_lng - step;
                map.panTo(new L.LatLng(current_lat, current_lng));
            }

            if (direction == "right") {
                zoom_speed()

                current_lng = current_lng + step;
                map.panTo(new L.LatLng(current_lat, current_lng));
            }

            if (direction == "up") {
                zoom_speed()

                current_lat = current_lat + step;
                map.panTo(new L.LatLng(current_lat, current_lng));

            }

            if (direction == "down") {
                zoom_speed()

                current_lat = current_lat - step;
                map.panTo(new L.LatLng(current_lat, current_lng));

            }
        }

    }

    //////////////////////
    //FINDER NAVIGATION//
    /////////////////////

    function nav(move) {
        if (windowOpen == "finder") {



            let items = document.querySelectorAll('.items');
            if (move == "+1") {
                if (tabIndex < items.length - 1) {

                    tabIndex++
                    $('div#finder div.items[tabindex=' + tabIndex + ']').focus()

                    $('html, body').animate({
                        scrollTop: $(':focus').offset().top + 'px'
                    }, 'fast');

                }
            }


            if (move == "-1") {
                if (tabIndex > 0)

                {
                    tabIndex--
                    $('div#finder div.items[tabindex=' + tabIndex + ']').focus()

                    $('html, body').animate({
                        scrollTop: $(':focus').offset().top + 'px'
                    }, 'fast');

                }
            }
        }

    }




    //////////////////////////////
    ////KEYPAD HANDLER////////////
    //////////////////////////////



    let longpress = false;
    const longpress_timespan = 1000;
    let timeout;

    function repeat_action(param) {
        switch (param.key) {
            case 'ArrowUp':
                MovemMap("up")
                break;

            case 'ArrowDown':
                MovemMap("down")
                break;

            case 'ArrowLeft':
                MovemMap("left")
                break;

            case 'ArrowRight':
                MovemMap("right")
                break;

            case 'Enter':
                break;
        }
    }

    //////////////
    ////LONGPRESS
    /////////////


    function longpress_action(param) {
        switch (param.key) {
            case 'ArrowUp':
                break;

            case 'ArrowDown':
                break;

            case 'ArrowLeft':
                break;

            case 'ArrowRight':
                break;

            case 'Enter':
                addMapLayers("delete-marker");
                break;
        }
    }


    ///////////////
    ////SHORTPRESS
    //////////////

    function shortpress_action(param) {
        switch (param.key) {
            case 'Backspace':
                param.preventDefault();
                if (windowOpen == "finder") {
                    $('div#finder').css('display', 'none');
                    windowOpen = "map";
                    return false

                }

                if (windowOpen == "coordinations") {
                    coordinations("hide");
                    return false;
                }
                if (windowOpen == "map") {
                    let lk_state = localStorageWriteRead("lockscreen_state", "");
                    if (lk_state == "disabled") {
                        setScreenlockPasscode(false);
                    }

                    if (lk_state == "enabled") {
                        setScreenlockPasscode(true);
                    }

                    toaster("Goodbye");

                    setTimeout(function() {
                        window.close();
                    }, 4000);

                }

                break;

            case 'SoftLeft':
                killSearch();
                ZoomMap("in");
                unload_map(false);
                break;

            case 'SoftRight':
                ZoomMap("out");
                unload_map(true);
                break;

            case 'Enter':
                addMapLayers("add-marker");
                break;

            case '0':
                showMan();
                break;

            case '1':
                getLocation("updateMarker")
                break;

            case '2':
                param.preventDefault()
                showSearch();
                break;

            case '3':
                param.preventDefault()
                read_json("finder")
                break;

            case '4':
                lockScreenDisabler();
                geolocationWatch();
                break;

            case '5':
                getLocation("save_marker");
                break;

            case '6':
                coordinations("show");
                break;

            case 'ArrowRight':
                MovemMap("right")
                break;

            case 'ArrowLeft':
                MovemMap("left")
                break;

            case 'ArrowUp':
                MovemMap("up")
                nav("-1");
                break;

            case 'ArrowDown':
                MovemMap("down")
                nav("+1")
                break;
        }
    }

    /////////////////////////////////
    ////shortpress / longpress logic
    ////////////////////////////////

    function handleKeyDown(evt) {
        if (!evt.repeat) {
            evt.preventDefault();
            longpress = false;
            timeout = setTimeout(() => {
                longpress = true;
                longpress_action(evt);
            }, longpress_timespan);
        }

        if (evt.repeat) {
            longpress = false;
            repeat_action(evt);
        }
    }

    function handleKeyUp(evt) {
        evt.preventDefault();
        clearTimeout(timeout);
        if (!longpress) {
            shortpress_action(evt);
        }
    }






    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);



    //////////////////////////
    ////BUG OUTPUT////////////
    /////////////////////////


    $(window).on("error", function(evt) {

        console.log("jQuery error event:", evt);
        let e = evt.originalEvent; // get the javascript event
        console.log("original event:", e);
        if (e.message) {
            alert("Error:\n\t" + e.message + "\nLine:\n\t" + e.lineno + "\nFile:\n\t" + e.filename);
        } else {
            alert("Error:\n\t" + e.type + "\nElement:\n\t" + (e.srcElement || e.target));
        }
    });


});