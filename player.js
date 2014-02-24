function Player(username, money, production, items, tier){
	this.username = username;
	this.money = money;
	this.production = production;
	this.items = items;
	this.tier = tier;
	this.bids = [];
}

Player.prototype.update = function(money, production, items){
	this.money = money;
	this.production = production;
	this.items = items;
}

function Item(name, quantity, production, cost){
	if (typeof cost === 'undefined'){
		cost = 0;
	}
	this.name = name;
	this.quantity = quantity;
	this.production = production*quantity;
	this.cost = cost;
}

function Notification(sender, message){
	this.sender = sender;
	this.message = message;
}

function Bid(sender, amount){
	this.sender = sender;
	this.amount = amount;
}

function EmployeeInfo(xml){
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xml, "text/xml");

	//console.log(xmlDoc);
	
	var employeeName = xmlDoc.getElementsByTagName("name")[0];
	this.name = employeeName.textContent;
	
	var employees = xmlDoc.getElementsByTagName("employees")[0];
	this.employees = [];
	
	for (var i = 0; i < employees.childNodes.length; i++){
		var eName = employees.childNodes[i].getElementsByTagName("name")[0].textContent;
		var eProd = parseInt(employees.childNodes[i].getElementsByTagName("production")[0].textContent);
		var eTier = parseInt(employees.childNodes[i].getElementsByTagName("tier")[0].textContent);
		this.employees.push(new Employee(eName, eProd, eTier));
	}
}

function Employee(name, production, tier){
	this.name = name;
	this.production = production;
	this.tier = tier;
}

function GameInfo(username){
	this.player = new Player(username, 0, 0, [], 0);
	this.boss = new Player("", 0, 0, [], 0);
	this.employees = [];
	this.notifications = [];
	this.store = [];
}

GameInfo.prototype.update = function(xml){
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xml, "text/xml");
	xmlDox = xmlDoc.getElementsByTagName("gameInfo")[0];
	
	var player = xmlDoc.getElementsByTagName("player")[0];
	//console.log(xmlDoc.getElementsByTagName("player")[0]);
	
	this.player.money = parseInt(player.getElementsByTagName("money")[0].textContent);

	this.player.production = parseInt(player.getElementsByTagName("production")[0].textContent);
	
	this.player.tier = parseInt(player.getElementsByTagName("tier")[0].textContent);

	this.player.bids = [];
	var bids = player.getElementsByTagName("bids")[0];
	for (var i = 0; i < bids.childNodes.length; i++){
		var bid = bids.childNodes[i];
		this.player.bids.push(new Bid(bid.getElementsByTagName("bidder")[0].textContent, parseInt(bid.getElementsByTagName("amount")[0].textContent)));
	}
	
	this.player.items = {};
	
	var items = player.getElementsByTagName("items")[0];
	for (var i = 0; i < items.childNodes.length; i++){
		var item = items.childNodes[i];
		this.player.items[item.getElementsByTagName("name")[0].textContent] = new Item(item.getElementsByTagName("name")[0].textContent, parseInt(item.getElementsByTagName("quantity")[0].textContent), parseInt(item.getElementsByTagName("production")[0].textContent));
	}
	
	var store = player.getElementsByTagName("store");
	if (store.length > 0){
		this.store = [];
		store = store[0];
		for (var i = 0; i < store.childNodes.length; i++){
			var item = store.childNodes[i];
			var quantity = 0;
			var name = item.getElementsByTagName("name")[0].textContent;
			if (name in this.player.items){
				quantity = this.player.items[name].quantity;
			}
			this.store.push(new Item(name, quantity, parseInt(item.getElementsByTagName("production")[0].textContent), parseFloat(item.getElementsByTagName("cost")[0].textContent)));
		}
	}
	
	var boss = xmlDoc.getElementsByTagName("boss")[0];
	//this.boss.money = parseInt(boss.getElementsByTagName("money")[0].textContent);
	this.boss.username = boss.getElementsByTagName("name")[0].textContent;
	this.boss.production = parseInt(boss.getElementsByTagName("production")[0].textContent);
	this.boss.tier = parseInt(boss.getElementsByTagName("tier")[0].textContent);
	items = boss.getElementsByTagName("items")[0];
	this.boss.items = [];
	for (var i = 0; i < items.childNodes.length; i++){
		var item = items.childNodes[i];
		this.boss.items.push(new Item(item.getElementsByTagName("name")[0].textContent, parseInt(item.getElementsByTagName("quantity")[0].textContent), parseInt(item.getElementsByTagName("production")[0].textContent)));
	}
	
	var employees = xmlDoc.getElementsByTagName("employees")[0];
	this.employees = [];
	for (var i = 0; i < employees.childNodes.length; i++){
		var employee = employees.childNodes[i];
		this.employees.push(new Employee(employee.getElementsByTagName("name")[0].textContent, parseInt(employee.getElementsByTagName("production")[0].textContent), parseInt(employee.getElementsByTagName("tier")[0].textContent)));
	}
	
	var notifications = xmlDoc.getElementsByTagName("notifications");
	this.notifications = [];
	if (notifications.length > 0){
		notifications = notifications[0];
		for (var i = 0; i < notifications.childNodes.length; i++){
			var notification = notifications.childNodes[i];
			this.notifications.push(new Notification(notification.getElementsByTagName("sender")[0].textContent, notification.getElementsByTagName("message")[0].textContent));
		}
	}
}