class duel {
    constructor(channelID, duelData, timeoutInterval) {
        this.channelID = channelID;
        this.timeoutInterval = timeoutInterval;
        this.duelData = duelData;
        this.channelData = duelData[this.channelID];
        this.duelArray = [];
        this.size = 9;
      
        for (var i = 0; i < this.size; i++) {
            this.duelArray.push(new Array(this.size));
            this.duelArray[i].fill("o");
        }

        this.player1 = {
            "id": this.channelData.player1.id,
            "name": this.channelData.player1.name,
            "score": 0,
            "position": [3, 3],
            "dir": 4,
            "step": 1,
            "stepCounter": 1,
            "immunity": 0,
            "immunityCounter": 1,
            "stop": 0,
            "stopCounter": 1,
            "total": 3,
        };

        this.player2 = {
            "id": this.channelData.player2.id,
            "name": this.channelData.player2.name,
            "score": 0,
            "position": [3, 5],
            "dir": 4,
            "step": 1,
            "stepCounter": 1,
            "immunity": 0,
            "immunityCounter": 1,
            "stop": 1,
            "stopCounter": 1,
            "total": 3,
        };


        this.notification = "";

        this.enemies = [{
                "x": 1,
                "y": 0,
                "dir": -1,
                "length": 3
            }
            , {
                "x": 0,
                "y": Math.floor((this.size - 1) / 2),
                "dir": -1,
                "length": 7
            },
            {
                "x": 2,
                "y": this.size - 2,
                "dir": 1,
                "length": 3
            }
        ];


        this.food = [1, 4];

        const filter = (reaction, user) => {
            return (user.id === this.player1.id || user.id === this.player2.id);
        };


        this.collector = duelData[this.channelID].message.createReactionCollector({filter});


        this.collector.on('collect', (reaction, user) => {
            let currenPlayer, otherPlayer;
            if (user.id === this.player1.id) {
                currenPlayer = this.player1;
                otherPlayer = this.player2;
            } else if (user.id === this.player2.id) {
                currenPlayer = this.player2;
                otherPlayer = this.player1;
            } else {
                return;
            }

            if (reaction.emoji.name === "⬅") {
                currenPlayer.dir = 3;
            } else if (reaction.emoji.name === "➡") {
                currenPlayer.dir = 1;
            } else if (reaction.emoji.name === "⬆") {
                currenPlayer.dir = 4;
            } else if (reaction.emoji.name === "⬇") {
                currenPlayer.dir = 2;
            } else if (currenPlayer.total > 0) {
                if (reaction.emoji.name === "🍎") {
                    currenPlayer.total += -1;
                    currenPlayer.step = 2;
                    currenPlayer.stepCounter = 1;
                    this.notification += currenPlayer.name + " used double steps apple.\n";
                } else if (reaction.emoji.name === "🍏") {
                    currenPlayer.total += -1;
                    currenPlayer.immunity = 1;
                    currenPlayer.immunityCounter = 1;
                    this.notification += currenPlayer.name + " used immunity apple.\n";
                } else if (reaction.emoji.name === "🛑") {
                    currenPlayer.total += -1;
                    otherPlayer.stop = 1;
                    otherPlayer.stopCounter = 1;
                    this.notification += currenPlayer.name + " stopped " + this.player2.name + "\n";
                }
            }
            reaction.users.remove(user.id);
        });

        this.updateMessage();
    }


    newCoords() {
        let coordsArray = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i == this.player1.position[0] && j == this.player1.position[1]) {
                    continue;
                } else if (this.checkenemy(i, j) === true) {
                    continue;
                } else if (i == this.player2.position[0] && j == this.player2.position[1]) {
                    continue;
                } else {
                    coordsArray.push([i, j]);
                }
            }
        }
        return coordsArray[Math.floor(Math.random() * coordsArray.length)];
    }


    makeRequest(message, self) {
        return new Promise(function (resolve, reject) {
            try {
                self.channelData.message.edit(message).then(function (x) {
                    resolve(x);
                }).catch(function () {
                    reject("err");
                });
            } catch(err){
                console.error(err);
                reject("err");
            }
        });
    }

    async updateMessage() {
        try {
            await this.makeRequest(this.arrayPrint(), this);
            this.timeout = setTimeout(this.mainLoop, this.timeoutInterval, this);
        }
        catch(err) {
            console.error(err);
            this.end(this);
        }
    }
        



    arrayPrint() {
        let temp = "";
        for (let i = 0; i <= this.duelArray.length - 1; i++) {
            for (let j = 0; j <= this.duelArray[i].length - 1; j++) {
                if (i == this.player1.position[0] && j == this.player1.position[1]) {
                    temp = temp + "🐼 ";
                } else if (i == this.player2.position[0] && j == this.player2.position[1]) {
                    temp = temp + "🐨 ";
                } else if (this.checkenemy(i, j) === true) {
                    temp = temp + "🟥 ";
                } else if (i == this.food[0] && j == this.food[1]) {
                    temp = temp + "🍎 ";
                } else {
                    temp = temp + "⬜ ";
                }
            }
            temp = temp + "\n";
        }
        return "\n\n```" + this.player1.name + "🐼(" + this.player1.total + "):" + this.player1.score + "           " + this.player2.name + "🐨(" + this.player2.total + "):" + this.player2.score + "\n\n" + this.notification + "```\n\n" + temp + "```\n\n\n```";
    }


    checkenemy(yCoord, xCoord) {
        for (let i = 0; i < this.enemies.length; i++) {
            if ((xCoord >= this.enemies[i].x && xCoord < (this.enemies[i].x + this.enemies[i].length)) && yCoord == this.enemies[i].y) {
                return true;
            }
        }
        return false;
    }

    outOfBounds(x ,y, self){
        return (x < 0 || x > self.size - 1 || y < 0 || y > self.size - 1);
    }
    
    mainLoop(self) {
        try {
            self.count++;
            for (let i = 0; i < self.enemies.length; i++) {
                let thisEnemy = self.enemies[i];
                if (thisEnemy.x <= 0 || (thisEnemy.x + thisEnemy.length - 1) >= (self.size - 1)) {
                    thisEnemy.dir *= -1;
                }
                thisEnemy.x += thisEnemy.dir;
            }


            let player1 = self.player1;
            let player2 = self.player2;

            var player2_check = 0;
            var player1_check = 0;


            let powerUpKeys = [["immunity", "immunityCounter" ,1],["step", "stepCounter", 2],["stop", "stopCounter", 1]];
           
            for(let j = 0; j <= 1; j++){
                let currenPlayer = player1;
                if(j == 1){
                    currenPlayer = player2;
                }

                for(let i = 0; i < powerUpKeys.length; i++){
                    let thisPowerup = powerUpKeys[i];
                    if (currenPlayer[thisPowerup[0]] === thisPowerup[2]) {
                        currenPlayer[thisPowerup[1]] += 1;
                        if (currenPlayer[thisPowerup[1]] == 6) {
                            currenPlayer[thisPowerup[0]] = 0;
                            currenPlayer[thisPowerup[2]]= 1;
                        }
                    }
                }
            }


            if (self.player2.immunityCounter == 5) {
                player2_check = 1;
            }

            if (self.player1.immunityCounter == 5) {
                player1_check = 1;

            }


           

            if (player1.stop === 0 || player1_check === 1) {
                player1.position[player1.dir%2] += player1.step * (1 - 2*Math.floor((player1.dir - 1)/2));
            }

            if (player2.stop === 0 || player2_check === 1) {
                player2.position[player2.dir%2] += player2.step * (1 - 2*Math.floor((player2.dir - 1)/2));
            }

            if (player2.immunity === 0 && self.checkenemy(self.player2.position[0], self.player2.position[1]) === true) {
                self.notification += self.player2.name + " died by colliding into the obstacles.\n";
                self.end(self);
                return;
            }
            else if (player1.immunity === 0 && self.checkenemy(self.player1.position[0], self.player1.position[1]) === true) {
                self.notification += self.player1.name + " died by colliding into the obstacles.\n";
                self.end(self);
                return;
            }



            if (self.outOfBounds(self.player1.position[0],self.player1.position[1],self)){
                self.notification += self.player1.name + " died.\n";
                self.end(self);
                return;
            }else if (self.outOfBounds(self.player2.position[0],self.player2.position[1],self)) {
                self.notification += self.player2.name + " died.\n";
                self.end(self);
                return;
            }

            let score_check = 0;
            if (self.player1.position[0] == self.food[0] && self.player1.position[1] == self.food[1]) {
                self.player1.score += 1;
                if (self.player1.score % 3 == 0) {
                    self.player1.total++;
                }
                score_check = 1;
            }

            if (self.player2.position[0] == self.food[0] && self.player2.position[1] == self.food[1]) {
                self.player2.score += 1;
                if (self.player2.score % 3 == 0) {
                    self.player2.total++;
                }
                score_check = 1;
            }

            if (score_check === 1) {
                self.food = self.newCoords();
            }

            self.updateMessage().then().catch();

        } catch (err) {
            console.log(err);
            self.end(self);
            return;
        }



    }

    async end(self) {
        try{
            clearTimeout(self.timeout);
            await this.makeRequest(this.arrayPrint(), this);
        }catch(err){
            console.log(err);
        }finally{
            self.collector.stop();
            self.duelData[self.channelID] = {};
            self.duelData[self.channelID].check = 0;
        }
    }

}
module.exports = duel;