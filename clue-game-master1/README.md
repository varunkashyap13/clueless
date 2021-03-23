#Clue Game (minified) 


###Set up Guide 


<p>Clone the Repository</p>

    git clone https://github.com/cod3hunt/clue-game.git

<p>Unzip the folder</p>

    unzip clue-game.zip
    cd clue-game

<p>Spin up the Service Containers</p>

    // Build Images
    docker-compose build
    // Start Services
    docker-compose up
    // Stop Services
    docker-compose stop
    // Tear Down
    docker-compose down

<p>Service Coordinates</p>

    > Game Management Service
    http://localhost:12000/v1/game/instance   
    
    // Routes
    curl -s -X POST 'http://localhost:12000/v1/game/instance' | jq '.'
    curl -s -X GET 'http://localhost:12000/v1/game/instance/:_id' | jq '.'

    > Frontend
    http://localhost:14000 
    
    > Notification Service 
    http://localhost:13000