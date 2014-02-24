//logic
var money = 0;
var moneyRate = 0;
var moneyTimer = new ArlEtc.Timer(1);
var menus = ["deskMenu", "officeMenu", "employeesMenu", "emailMenu"];
var menuIndex = 0;
var employeeLevelDepth = 0;

var moneyRateForBoss = 0;
var moneyRateFromEmployees = 0;

var timeUntilEmailIsOld = 5; //seconds

//ajax server communication
var username = "Test User 1";
var gameInfo;
var updateTimer = new ArlEtc.Timer(5);
var hasNewNotification = false;

//text
var moneyUnit = "$";
var unitPerSecond = moneyUnit + " / s";
var quoteChar = '"';
var quoteChar_Single = "'";
var myName = "ME";
var myBossName = "MY BOSS";

//graphics
var dullRed = new ArlDraw.Color(200,150,150,1);
var dullBlue = new ArlDraw.Color(150,150,200,1);
var dullGreen = new ArlDraw.Color(150,200,150,1);
var darkGrey = new ArlDraw.Color(50,50,50,1);
var employeeColor1 = new ArlDraw.Color(200,200,200,1);
var employeeColor2 = new ArlDraw.Color(150,150,150,1);
var emailUnread = new ArlDraw.Color(230,230,230,1);
var emailRead = new ArlDraw.Color(120,120,120,1);
var scribbleList = [];
var maxScribbleLength = 800;

//data
var employeeList = [];
var notificationList = [];

//EVENTS
ArlGame.events.resize = function() {
	//number of pixels inside the canvas should match the number of pixels it takes up on the screen
	ArlGame.gameCanvas.width = ArlGame.gameCanvas.scrollWidth;
	ArlGame.gameCanvas.height = ArlGame.gameCanvas.scrollHeight;
};
ArlGame.events.onCursorDown = function() {
	scribbleList.push(new ArlMath.Point(ArlGame.cursorPos.x, ArlGame.cursorPos.y));

	//notificationList.push(new Message("test test test"));
};
ArlGame.events.onCursorMove = function() {
	if (ArlGame.isCursorDown) {
		scribbleList.push(new ArlMath.Point(ArlGame.cursorPos.x, ArlGame.cursorPos.y));

		if (ArlMath.pathLength(scribbleList) > maxScribbleLength) {
			money++;
			scribbleList = [];

			$.ajax({
				url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
				type: 'post',
				data: {'UpdateType' : 'Interacted', 'Username' : name},
				success: function(msg) {
					console.log(msg);
				},
				error: function(msg) {
					console.log("nope nope nope");
				}
			});
		}
	}
};
ArlGame.events.onCursorUp = function() {
	scribbleList = [];
};
ArlGame.events.init = function() {
	//number of pixels inside the canvas should match the number of pixels it takes up on the screen
	ArlGame.gameCanvas.width = ArlGame.gameCanvas.scrollWidth;
	ArlGame.gameCanvas.height = ArlGame.gameCanvas.scrollHeight;

	switchUser("Test User 1");
};
ArlGame.events.mainLoop = function() {
	ArlDraw.clearCanvas(ArlGame.gameCanvas);

	var realMoneyRate = moneyRate * 0.5;

	var curMoney = Math.floor(money + (realMoneyRate * moneyTimer.percentDone()));	

	document.getElementById("money").innerHTML = curMoney + " " + moneyUnit;
	document.title = curMoney;

	document.getElementById("moneyRate").innerHTML = "my production: + " + moneyRate + " " + unitPerSecond;

	document.getElementById("moneyRateForBoss").innerHTML = "to boss: - " + moneyRateForBoss + " " + unitPerSecond;
	document.getElementById("moneyRateFromEmployees").innerHTML = "from employees: + " + moneyRateFromEmployees + " " + unitPerSecond;

	var totalMoneyRate = moneyRate - moneyRateForBoss + moneyRateFromEmployees;
	document.getElementById("moneyRateTotal").innerHTML = "<hr/>" + "TOTAL : " + totalMoneyRate + " " + unitPerSecond;

	if (moneyTimer.isDone()) {
		money += realMoneyRate;

		moneyTimer.reset();
	}

	if (updateTimer.isDone()) {
		$.ajax({
			url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
			type: 'post',
			data: {'UpdateType' : 'NormalUpdate', 'Username' : username},
			success: defaultUpdate,
			error: function() {
				console.log("nope nope nope");
			}
		});
		updateTimer.reset();
	}

	drawPaperLines(ArlGame.context, ArlGame.gameCanvas.width, ArlGame.gameCanvas.height, 10, dullRed, dullBlue);
	ArlDraw.drawPath(ArlGame.context, scribbleList, 2, darkGrey);

	updateEmailButton();

	var hasOldNotification = false;
	if (menuIndex == 0) {
		for (var i = notificationList.length-1; i >= 0; i--) {
			if (notificationList[i].update()) {
				hasOldNotification = true;
			}
		}
	}

	if (hasNewNotification || hasOldNotification){
		var notificationDiv = document.getElementById("emailMenu2");
		notificationDiv.innerHTML = "";
		for (var i = notificationList.length-1; i >= 0; i--) {
			notificationDiv.innerHTML += notificationList[i].toHTML();
		}
		hasNewNotification = false;
	}

	
};

//FUNCTIONS
var defaultUpdate = function(msg) {
	//console.log(msg); //returns xml whooo which can be parsed by player.js whoo

	gameInfo.update(msg);

	myBossName = gameInfo.boss.username;

	money = gameInfo.player.money;
	//console.log(gameInfo.player.money);
	moneyRate = parseInt(gameInfo.player.production)
	moneyRateForBoss = moneyRate / 2;
	moneyRateFromEmployees = 0;
	for (var i = 0; i < gameInfo.employees.length; i++) {
		moneyRateFromEmployees += gameInfo.employees[i].production / 2;
	}

	//notifications
	for (var i = 0; i < gameInfo.notifications.length; i++) {
		var m = new Message(gameInfo.notifications[i].sender + ": " + gameInfo.notifications[i].message);
		notificationList.push(m);
		hasNewNotification = true;
		if (gameInfo.notifications[i].message == "You have a new job offer!") {
			for (var j = 0; j < gameInfo.player.bids.length; j++) {
				if (gameInfo.player.bids[j].sender == gameInfo.notifications[i].sender) {
					//console.log("BIDDD");
					//console.log(gameInfo.player.bids[j]);
					m.setBid(gameInfo.player.bids[j].sender);
				}
			}
		}
	}

}

var drawPaperLines = function (context, width, height, numLines, color1, color2) {
	var lineSeparation = (height - (height/5)) / numLines;
	for (var i = 0; i < numLines; i++) {
		ArlDraw.drawLine(context, 0, (height/5) + (i*lineSeparation), width, (height/5) + (i*lineSeparation), 1, color2);
	}
	ArlDraw.drawLine(context, width/6, 0, width/6, height, 2, color1);
}

var buyUpgrade = function(cost, itemName) {
	if (money >= cost) {

		money -= cost;

		$.ajax({
			url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
			type: 'post',
			data: {'UpdateType' : 'BoughtItem', 'Username' : username, 'NewItem' : itemName},
			success: function(msg) {
				console.log(msg); //returns xml whooo which can be parsed by player.js whoo
				gameInfo.update(msg);

				money = gameInfo.player.money;
				//console.log(gameInfo.player.money);
				moneyRate = parseInt(gameInfo.player.production)
			},
			error: function() {
				console.log("nope nope nope");
			}
		});
	}
}

var getMenu = function(index) {
	return document.getElementById(menus[index]);
}

var switchMenu = function(index) {
	if (menuIndex == 3) {
		for (var i = 0; i < notificationList.length; i++) {
			notificationList[i].isRead = true;
		}
	}

	getMenu(menuIndex).style.display = "none";
	menuIndex = index;
	getMenu(menuIndex).style.display = "block";	

	if (menuIndex == 2) {
		var employeesDiv = document.getElementById("employeesMenu");
		employeesDiv.innerHTML = "";
		employeeLevelDepth = 0;

		newBossLevel(gameInfo.boss);
		myBossName = gameInfo.boss.username;
		newEmployeeLevel(1, gameInfo.boss.username);
		newEmployeeLevel(2, gameInfo.player.username);
	}
	else if (menuIndex == 3) {
		var notificationDiv = document.getElementById("emailMenu")
		notificationDiv.innerHTML = "";

		for (var i = notificationList.length-1; i >= 0; i--) {
			notificationDiv.innerHTML += notificationList[i].toHTML();
		}
	}
}

var switchUser = function(newUsername) {
	username = newUsername;
	gameInfo = new GameInfo(username);
	document.getElementById("usernameOutput").innerHTML = "USER: " + username;

	$.ajax({
		url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
		type: 'post',
		data: {'UpdateType' : 'NormalUpdate', 'Username' : username},
		success: defaultUpdate,
		error: function() {
			console.log("nope nope nope");
		}
	});
}

var newEmployeeLevel = function(level, bossName, color) {
	console.log("***");
	console.log(employeeLevelDepth);

	$.ajax({
		url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
		type: 'post',
		data: {'UpdateType' : 'EmployeeInfo', 'Employee' : bossName},
		success: function(msg) {
			//console.log(msg); //returns xml whooo which can be parsed by player.js whoo
			console.log(msg);
			var tempGameInfo = new EmployeeInfo(msg);
			//tempGameInfo.update(msg);


			var levelDiv = document.getElementById("employeeLevel" + level.toString());
			if (levelDiv == null) {
				document.getElementById("employeesMenu").innerHTML += "<div id='employeeLevel" + level.toString() + "' class='employeeLevel'></div>";
				levelDiv = document.getElementById("employeeLevel" + level.toString());
			}


			if (level > employeeLevelDepth) {
				employeeLevelDepth = level;
			}

			console.log("clear");
			for (var i = level; i <= employeeLevelDepth; i++) {
				console.log(i);
				document.getElementById("employeeLevel" + i.toString()).innerHTML = "";
			}

			levelDiv.innerHTML = "";
			levelDiv.innerHTML += bossName + "'s EMPLOYEES <br/>";
			console.log(tempGameInfo.employees);
			for (var i = 0; i < tempGameInfo.employees.length; i++) {
				var e = new EmployeeWrapper(tempGameInfo.employees[i].name, tempGameInfo.employees[i].production);
				levelDiv.innerHTML += e.toHTML(level);
			}

			if (bossName == myBossName) {
				levelDiv.style.background = dullBlue.toHTML();
			}
			else {
				if (level % 2 == 0) {
					levelDiv.style.background = employeeColor1.toHTML();
				}
				else {
					levelDiv.style.background = employeeColor2.toHTML();
				}
			}
		},
		error: function() {
			console.log("nope nope nope");
		}
	});
}

var openEmployeeInfoPopup = function(name) {
	$.ajax({
		url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
		type: 'post',
		data: {'UpdateType' : 'NormalUpdate', 'Username' : name},
		success: function(msg) {
			var tmpGameInfo = new GameInfo(name);
			tmpGameInfo.update(msg);

			console.log(tmpGameInfo);

			document.getElementById("employeeInfoPopup").style.display = "block";

			document.getElementById("employeeInfoPopup_Name").innerHTML = name;
			document.getElementById("employeeInfoPopup_Production").innerHTML = tmpGameInfo.player.production + " " + unitPerSecond;
			document.getElementById("employeeInfoPopup_EmployeeNum").innerHTML = tmpGameInfo.employees.length + " employees";
			document.getElementById("employeeInfoPopup_offerBidButton").onclick = function() {
				offerBidTo(name);
			};

			var numBids = 0;
			for (var i = 0; i < gameInfo.player.bids.length; i++) {
				if (gameInfo.player.bids[i].sender == name) {
					numBids++;
				}
			}
			
			if (numBids > 0) {
				document.getElementById("employeeInfoPopup_acceptBidButton").style.display = "block";
				document.getElementById("employeeInfoPopup_acceptBidButton").onclick = function() {
					acceptBidFrom(name);
				};

				var itemList = "";
				for (var i = 0; i < tmpGameInfo.players.items.length;i ++){
					itemList += tmpGameInfo.players.items[i] + ",";
				}
				document.getElementById("employeeInfoPopup_OfficeSupplies").innerHTML = itemList;
				document.getElementById("employeeInfoPopup_OfficeSupplies").style.display = "block";
			} else {
				document.getElementById("employeeInfoPopup_acceptBidButton").style.display = "none";
				document.getElementById("employeeInfoPopup_OfficeSupplies").style.display = "none";
			}
		},
		error: function() {
			console.log("nope nope nope");
		}
	});
}

var newBossLevel = function(bossInfo, color) {
	var level = 0;
	var levelDiv = document.getElementById("employeeLevel" + level.toString());
	if (levelDiv == null) {
		document.getElementById("employeesMenu").innerHTML += "<div id='employeeLevel" + (level).toString() + "' class='employeeLevel'></div>";
		levelDiv = document.getElementById("employeeLevel" + level.toString());
	}

	var boss = new EmployeeWrapper(bossInfo.username, bossInfo.production);

	levelDiv.innerHTML = "";
	levelDiv.innerHTML += "BOSS <br/>"
	levelDiv.innerHTML += boss.toHTML(level);
	levelDiv.style.background = dullRed.toHTML();
}

var findEmployeeByName = function(name) {
	for (var i = 0; i < employeeList.length; i++) {
		var e = employeeList[i];
		if (e.name == name) {
			return e;
		}
	}
	return null;
}

var updateEmailButton = function() {
	var unread = 0;
	for (var i = 0; i < notificationList.length; i++) {
		if (!notificationList[i].isRead) {
			unread++;
		}
	}
	//document.getElementById("emailButton").innerHTML = "Email Inbox (" + unread.toString() + ")";
	document.getElementById("deskButton").innerHTML = "My Desk (" + unread.toString() + ")";
}

var offerBidTo = function(name) {
	$.ajax({
		url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
		type: 'post',
		data: {'UpdateType' : 'OfferBid', 'Username' : username, 'Employee' : name, 'BidAmount' : 10}, //placeholder amount = 10
		success: function(msg) {
			console.log(msg);
		},
		error: function() {
			console.log("nope nope nope");
		}
	});
}

var acceptBidFrom = function(name) {
	$.ajax({
		url: 'http://pencilpusher.gamestudio.gatech.edu/gameLogic.php',
		type: 'post',
		data: {'UpdateType' : 'AcceptBid', 'Username' : username, 'Bidder' : name},
		success: function(msg) {
			console.log(msg);
		},
		error: function() {
			console.log("nope nope nope");
		}
	});
}

//OBJECTS
var EmployeeWrapper = function(name, productionRate, boss) {
	this.name = name;
	this.productionRate = productionRate;
	this.boss = boss;
	if (boss != null) {
		this.boss.addEmployee(this);
	}
	this.employees = [];
};
EmployeeWrapper.prototype = {
	addEmployee: function(newEmployee) {
		this.employees.push(newEmployee);
	},
	toHTML: function(level) {
		var htmlStr = "";

		htmlStr += "<div class='employeeBoxWrapper' style='color: #000; position: relative; float:left;'>";
		htmlStr += "<center>";
		htmlStr += "^<br/>";
		htmlStr += "|<br/>";
		htmlStr += "<div class='employeeBox'>";
		htmlStr += this.name + "<br/>";
		htmlStr += this.productionRate + " " + unitPerSecond + "<br/>";
		htmlStr += "<button onclick='openEmployeeInfoPopup(" + quoteChar + this.name + quoteChar + ");'>MORE INFO</button><br/>";
		htmlStr += "<button onclick='newEmployeeLevel(" + (level + 1).toString() + "," + quoteChar + this.name + quoteChar + ", employeeColor1);'>EMPLOYEES</button><br/>";
		htmlStr += "</div>";
		htmlStr += "</center>";
		htmlStr += "</div>";

		return htmlStr;
	},
};

var Message = function(message) {
	this.message = message;
	this.isRead = false;

	this.hasBid = false;
	this.bidder = "";

	//this.oldnessTimer = new ArlEtc.Timer(timeUntilEmailIsOld);
	this.oldnessTimer = null;
};
Message.prototype = {
	toHTML: function(color) {
		var htmlStr = "";

		var fontWeight = "normal";
		var c = emailRead.toHTML();
		if (!this.isRead) {
			fontWeight = "bold";
			c = emailUnread.toHTML();
		}

		htmlStr += "<div class='notification' style='background: " + c + "; font-weight: " + fontWeight + ";'>";
		htmlStr += this.message;
		if (this.hasBid) {
			htmlStr += "<button onclick='openEmployeeInfoPopup(" + quoteChar + this.bidder + quoteChar + ");'>More Info</button>";
		}
		htmlStr += "</div>";

		return htmlStr;
	},
	setBid: function(bidder) {
		this.bidder = bidder;
		this.hasBid = true;
	},
	update: function() {
		if (this.oldnessTimer == null) {
			this.oldnessTimer = new ArlEtc.Timer(timeUntilEmailIsOld);
		}

		if (!this.isRead) {
			if (this.oldnessTimer.isDone()) {
				this.isRead = true;
			}
			return this.isRead;
		}
		return false;
	}
};