<?php
	include("database.php");
	
//	$username = $_POST["Username"];
	$username = "Tester";
	$userInfo = user_info($username);
	$userItems = get_equipment($username);
	
	$bossInfo = user_info($userInfo["Boss"]);
	$bossItems = get_equipment($bossInfo['Username']);
	
	$employeesInfo = get_employees($username);
	$returnInfo = "";
	
	$updateType = $_POST["UpdateType"];
	
//	$updateType = "NormalUpdate";
	switch ($updateType){
		case "NormalUpdate":
			normal_update();
			break;
		case "BoughtItem":
			bought_item();
			break;
		case "Online":
			online();
			break;
		case "Offline":
			offline();
			break;
		case "AcceptBid":
			accept_bid();
			break;
		case "RejectBid":
			reject_bid();
			break;
		case "Interacted":
			interact();
			break;
	}
	
	$returnInfo = generate_playerXML();
	echo $returnInfo;	
	
	function normal_update(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$date = new DateTime($userInfo["LastUpdated"]);
		$updateTime = (time() - $date->getTimestamp());
		$userInfo['Production'] = calculate_production();
		$moneyEarned = $userInfo['Production'] * $updateTime;
		$userInfo['Money'] += $moneyEarned / 2;
		$bossInfo['Money'] += $moneyEarned / 2;
		$date = new DateTime();
		user_update($username, $userInfo['Money'], $userInfo['Production'], $date->format(DateTime::ISO8601));
		update_boss($bossInfo['Username'], $bossInfo['Money']);
	}
	
	function online(){
		global $username;
		$date = new DateTime();
		user_online($username, $date->format(DateTime::ISO8601));
	}
	
	function offline(){
		global $username;
		normal_update();
		$date = new DateTime();
		user_offline($username, $date->format(DateTime::ISO8601));
	}
	
	function interact(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$userInfo["Money"] += 2;
	}
	
	function accept_bid(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$bidder = $_POST['Bidder'];
		$bid = get_bid($username, $bidder);
		$bidAmount = $bid['Bid'];
		$userInfo['Money'] += $bidAmount;
		normal_update();
		remove_bid($username, $bidder);
		notify_user($bossInfo["Username"], $username, 1, "");
		
		$userInfo['Boss'] = $bidder;
		$bossInfo = user_info($bidder);
		$bossItems = get_equipment($bossInfo['Username']);
		
		new_boss($username, $bidder);
		notify_user($bossInfo["Username"], $username, 2, "");
	}
	
	function reject_bid(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		normal_update();
		remove_bid($username, $bidder);	
		notify_user($bossInfo["Username"], $username, 3, "");
	}
	
	function bought_item(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		normal_update();
		$item = $_POST['NewItem'];
		$userInfo["Money"] -= get_cost($item);
		new_equipment($username, $item);
		user_update($username, $userInfo['Money'], $userInfo['Production'], time());
		$userItems = get_equipment($username);
		
		foreach ($employeesInfo as $employee){
			notify_user($employee["Username"], $username, 4, $item);
		}
	}
	
	function calculate_production(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$production = 0;
		foreach ($userItems as $item){
			$production += get_production($item["Equipment"]) * $item["Quantity"];
		}
		foreach ($bossItems as $item){
			$production += get_production($item);
		}
		return $production;
	}
	
	function get_production($item){
		switch ($item){
			case "Pen":
				return 1;
				break;
			case "Typewriter":
				return 5;
				break;
			case "Word Processor":
				return 100;
				break;			
		}
		return 0;
	}
	
	function get_cost($item){
		switch ($item){
			case "Pen":
				return 5;
				break;
			case "Typewriter":
				return 100;
				break;
			case "Word Processor":
				return 1500;
				break;	
		}
		return 0;
	}
	
	function generate_playerXML(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeesInfo, $updateType;
		$xml = "<gameInfo>";
		$xml = "<player>";
		$xml .= "<money>" . $userInfo['Money'] . "</money>";	
		$xml .= "<production>" . $userInfo['Production'] . "</production>";
		if ($updateType == "Online" || $updateType == "RejectBid" || $updateType == "AcceptBid"){
			$xml .= "<bids>";
			$bids = get_bids($username);
			foreach ($bids as $bid){
				$xml .= "<bid>";
				$xml .= "<bidder>" . $bid["Bidder"] . "</bidder>";
				$xml .= "<amount>" . $bid["Bid"] . "</amount>";
				$xml .= "</bid>";
			}
			$xml .= "</bids>";
		}
		if ($updateType == "Online" || $updateType == "BoughtItem"){
			$xml .= "<items>";
			foreach ($userItems as $item){
				$xml .= "<item>";
				$xml .= "<name>" . $item["Equipment"] . "</name>";
				$xml .= "<quantity>" . $item["Quantity"] . "</quantity>";
				$xml .= "</item>";
			}
			$xml .= "</items>";
		}
		$xml .= "</player>";
		$xml .= "<employees>";
		foreach ($employeesInfo as $employee){
			$xml .= "<employee>";
			$xml .= "<name>" . $employee['Username'] . "</name>";
			$xml .= "<production>" . $employee['Production'] . "</production>";
			$xml .= "</employee>";
		}
		$xml .= "</employees>";
		
		$xml .= "<boss>";
		$xml .= "<name>" . $bossInfo["Username"] . "</name>";
		$xml .= "<items>";
		foreach ($bossItems as $item){
			$xml .= "<item>";
			$xml .= "<name>" . $item["Equipment"] . "</name>";
			$xml .= "<quantity>" . $item["Quantity"] . "</quantity>";
			$xml .= "</item>";
		}
		$xml .= "</items>";
		$xml .= "</boss>";
		
		$notifications = get_notifications($username);
		if (count($notifications) > 0){
			$xml .= "<notifications>";
			foreach ($notifications as $notification){
				$xml .= "<notification>";
				$xml .= "<sender>" . $notification["Sender"] . "</sender>";
				$xml .= "<message>" . get_message($notification["Sender"], $notification["MessageCode"], $notification["MessageVariable"]) . "</message>";
				$xml .= "</notification>";
			}
			$xml .= "</notifications>";
			clear_notifications();
		}
		$xml .= "</gameInfo>";
		return $xml;
	}
	
	function get_message($sender, $messageCode, $variable){
		$message = "";
		switch ($messageCode){
			case 0:
				break;
			case 1:
				$message = "$sender has left your team!";
				break;
			case 2:
				$message = "$sender has accepted your offer!";
				break;
			case 3:
				$message = "$sender has rejected your offer!";
				break;
			case 4:
				$message = "Your boss has bought you a new $variable!";
				break;
		}
		return $message;
	}
?>