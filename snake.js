class snake {
    constructor(channelID, authorID, timeoutInterval, snakeData) {
        this.channelID = channelID;
        this.authorID = authorID;
        this.timeoutInterval = timeoutInterval;
        this.channelData = snakeData[channelID];
        this.snakeData = snakeData;
        this.timeout;
        this.snakeArray = [];
        this.size = 4;
        this.staticData = {
            "food": "🍎",
            "snake" : "🟥",
            "emptySpace" : "⬜"
        };
        for (var i = 0; i < this.size; i++) {
            this.snakeArray.push(new Array(this.size));
            this.snakeArray[i].fill(this.staticData.emptySpace);
        }
        this.snakePos = [0, 0];
        this.dir = 1;
        this.snakeHistory = [];
        this.snakeFood = this.newCoords();
        this.snakeArray[this.snakeFood[0]][this.snakeFood[1]] = this.staticData.food;
        this.dir = 1;
        this.snakeLength = 1;
        this.prevDir = 1;

        const filter = (reaction, user) => {
            return user.id === this.authorID;
        };


        this.collector = this.channelData.message.createReactionCollector({filter});


        this.collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name === "⬅") {
                this.dir = 3;
            } else if (reaction.emoji.name === "➡") {
                this.dir = 1;
            } else if (reaction.emoji.name === "⬆") {
                this.dir = 4;
            } else if (reaction.emoji.name === "⬇") {
                this.dir = 2;
            }
            reaction.users.remove(user.id);
        });

        this.ini();
    }

    ini(){
        this.timeout = setTimeout(this.mainLoop, this.timeoutInterval, this);
    }

    newCoords() {
        let coordsArray = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.snakeArray[i][j] == this.staticData.emptySpace) {
                    coordsArray.push([i, j]);
                }
            }
        }
        return coordsArray[Math.floor(Math.random() * coordsArray.length)];
    }

    makeRequest(message, self) {
        return new Promise(function(resolve, reject) {
            try {
                self.channelData.message.edit(message).then(function(x) {
                    resolve(x);
                }).catch(function(err) {
                    console.error(err);
                    reject("err");
                });
            } catch(err) {
                console.error(err);
                reject("err");
            }
        });
    }

    async updateMessage() {
        try {
            await this.makeRequest(this.arrayPrint(), this);
            this.timeout = setTimeout(this.mainLoop, this.timeoutInterval, this);                
        } catch(err) {
            console.error(err);
            this.end();
        }
    }
     
    arrayPrint() {
        let temp = "";
        for (let i = 0; i <= this.snakeArray.length - 1; i++) {
            for (var j = 0; j <= this.snakeArray[i].length - 1; j++) {
                temp = temp + this.snakeArray[i][j] + " ";
            }
            temp = temp + "\n";
        }
        return temp + "\n\nScore: " + this.snakeLength;
    }

    mainLoop(self) {
        try {
            let oppDir = [3,4,1,2];
            if  (self.snakeLength != 1 && self.dir == oppDir[self.prevDir - 1])
            {
                self.dir = self.prevDir;
            }
            self.snakeHistory.push([self.snakePos[0], self.snakePos[1]]);

            self.snakePos[self.dir%2] += 1 - 2*Math.floor((self.dir - 1)/2);
            let position = self.snakePos;
            if (
                position[0] < 0 ||
                position[0] > self.size - 1 ||
                position[1] < 0 ||
                position[1] > self.size - 1
            ) {
                self.end();
                return;
            }

            let snakePosString = self.snakeArray[position[0]][position[1]];
            let foodPosString = self.snakeArray[self.snakeFood[0]][self.snakeFood[1]];

            if (snakePosString == self.staticData.food) {
                self.snakeLength++;
                self.snakeFood = self.newCoords();
            } else if (snakePosString == self.staticData.ssnake) {
                self.end();
                return;
            }


            self.snakeArray[self.snakeFood[0]][self.snakeFood[1]] = self.staticData.food;

            self.snakeArray[position[0]][position[1]] = self.staticData.snake;

            if (self.snakeHistory.length >= self.snakeLength) {
                self.snakeArray[self.snakeHistory[0][0]][self.snakeHistory[0][1]] = self.staticData.emptySpace;
                self.snakeHistory.shift();
            }

            self.prevDir = self.dir;

            self.updateMessage().then((x) => {
            }).catch((err) => {
                console.error(err);
            });
        } catch (err) {
            console.error(err);
            self.end();
            return;
        }
    }

    end() {
        clearTimeout(this.timeout);
        this.collector.stop();
        delete this.snakeData[this.channelID];
    }
}

module.exports = snake;
