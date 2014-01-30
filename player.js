function Player(username, money, production, items){
	this.username = username;
	this.money = money;
	this.production = production;
	this.items = items;
}

Player.prototype.update = function(money, production, items){
	this.money = money;
	this.production = production;
	this.items = items;
}

function Item(name, quantity, production){
	this.name = name;
	this.quantity = quantity;
	this.production = production*quantity;
}

function Notification(sender, message){
	this.sender = sender;
	this.message = message;
}

function GameInfo(username){
	this.player = new Player(username, 0, 0, []);
	this.boss = new Player("", 0, 0, []);
	this.employees = [];
	this.notifications = [];
}

GameInfo.prototype.update = function(xml){
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xml, "text/xml");
	
	var player = xmlDoc.getElementsByTagName("player")[0];
	
	this.player.money = parseInt(player.getElementsByTagName("money")[0].nodeValue);
	this.player.production = parseInt(player.getElementsByTagName("production")[0].nodeValue);
	this.player.items = [];
	var items = player.getElementsByTagName("items")[0];
	for (var i = 0; i < items.childNodes.length; i++){
		var item = items.childNodes[i];
		this.player.items.push(new Item(item.getElementsByTagName("name")[0].nodeValue, item.getElementsByTagName("quantity")[0].nodeValue, item.getElementsByTagName("production")[0].nodeValue));
	}
	
	var boss = xmlDoc.getElementsByTagName("boss")[0];
	this.boss.money = parseInt(boss.getElementsByTagName("money")[0].nodeValue);
	this.boss.production = parseInt(boss.getElementsByTagName("production")[0].nodeValue);
	items = boss.getElementsByTagName("items")[0];
	this.boss.items = [];
	for (var i = 0; i < items.childNodes.length; i++){
		var item = items.childNodes[i];
		this.boss.items.push(new Item(item.getElementsByTagName("name")[0].nodeValue, item.getElementsByTagName("quantity")[0].nodeValue, item.getElementsByTagName("production")[0].nodeValue));
	}
	
	var employees = xmlDoc.getElementsByTagName("employees")[0];
	this.employees = [];
	for (var i = 0; i < employees.childNodes.length; i++){
		var employee = employees.childNodes[i];
		this.employees.push(new Player(employee.getElementsByTagName("name")[0].nodeValue, 0, employee.getElementsByTagName("production")[0].nodeValue, []));
	}
	
	var notifications = xmlDoc.getElementsByTagName("notifications");
	this.notifications = [];
	if (notifications.length > 0){
		notifications = notifications[0];
		for (var i = 0; i < notifications.childNodes.length; i++){
			var notification = notifications.childNodes[i];
			this.notifications.push(new Notification(notification.getElementsByTagName("sender")[0].nodeValue, notification.getElementsByTagName("message")[0].nodeValue));
		}
	}
}