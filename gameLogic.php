<?php
	header("Access-Control-Allow-Origin: *");
	include("database.php");
	
	$username = $_POST["Username"];
	$userInfo = user_info($username);
	$userItems = get_equipment($username);
		
	$bossInfo = user_info($userInfo["Boss"]);
	$bossItems = get_equipment($bossInfo['Username']);
	
	$employeeInfo = get_employees($username);
	$returnInfo = "";
	
	$updateType = $_POST["UpdateType"];
	
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
		case "OfferBid":
			offer_bid();
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
		case "ResetUser":
			resetUser();
			break;
	}
	
	$returnInfo = generate_playerXML();
	echo $returnInfo;
	
	function normal_update(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$updateTime = time() - strtotime($userInfo["LastUpdated"]);
		$userInfo['Production'] = calculate_production();
		$moneyEarned = $userInfo['Production'] * $updateTime;
		$userInfo['Money'] += $moneyEarned / 2;
		$bossInfo['Money'] += $moneyEarned / 2;
		user_update($username, $userInfo['Money'], $userInfo['Production'], time());
		update_boss($bossInfo['Username'], $bossInfo['Money']);
	}
	
	function resetUser(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		reset_user($username);
		$userInfo = user_info($username);
	}
	
	function online(){
		global $username;
		user_online($username, time());
	}
	
	function offline(){
		global $username;
		normal_update();
		user_offline($username, time());
	}
	
	function interact(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$userInfo["Money"] += 1;
		$bossInfo["Money"] += 1;
		normal_update();
	}
	
	function offer_bid(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		$employee = $_POST['Employee'];
		$bidAmount = $_POST['BidAmount'];
		$userInfo['Money'] -= $bidAmount;
		new_bid($userInfo['Username'], $employee, $bidAmount);
		notify_user($employee, $username, 5, "");
		normal_update();		
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
		$userInfo['Tier'] = $bossInfo['Tier'] + 1;
		
		new_boss($username, $bidder);
		notify_user($bossInfo["Username"], $username, 2, "");
	}
	
	function reject_bid(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		normal_update();
		$bidder = $_POST['Bidder'];
		$bidderInfo = user_info($bidder);
		$bid = get_bid($username, $bidder);
		update_boss($bidder, $bidderInfo["Money"] + $bid["Bid"]);
		remove_bid($username, $bidder);	
		notify_user($bidder, $username, 3, "");
	}
	
	function bought_item(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo;
		normal_update();
		$item = $_POST['NewItem'];
		$userInfo["Money"] -= get_cost($item);
		$assocItem = array("Username" => $username, "Equipment" => $item, "Quantity" => has_equipment($username, $item));
		$userItems[] = $assocItem;
		new_equipment($username, $item);
		user_update($username, $userInfo['Money'], $userInfo['Production'], time());
		$userItems = get_equipment($username);
		
		foreach ($employeeInfo as $employee){
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
			$production += get_production($item["Equipment"]) * $item["Quantity"];
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
	
	function get_items(){
		return array("Pen", "Typewriter", "Word Processor");
	}
	
	function get_cost($item, $currentQuantity = 0){
		switch ($item){
			case "Pen":
				return 5 * (pow(1.15, $currentQuantity));
				break;
			case "Typewriter":
				return 100 * (pow(1.15, $currentQuantity));
				break;
			case "Word Processor":
				return 1500 * (pow(1.15, $currentQuantity));
				break;	
		}
		return 0;
	}
	
	function generate_playerXML(){
		global $userInfo, $bossInfo, $username, $userItems, $bossItems, $employeeInfo, $updateType;
		$xml = "";
		if ($updateType == "EmployeeInfo"){
			$name = $_POST["Employee"];
			$employees = get_employees($name);
			
			$xml = "<employeeInfo>";
			$xml .= "<name>" . $name . "</name>";
			$xml .= "<employees>";
			foreach ($employees as $employee){
				$xml .= "<employee>";
				$xml .= "<name>" . $employee["Username"] . "</name>";
				$xml .= "<production>" . $employee["Production"] . "</production>";
				$xml .= "<tier>". $employee["Tier"] . "</tier>";
				$xml .= "</employee>";
			}
			$xml .= "</employees>";
			$xml .= "</employeeInfo>";
		}
		else {
			$xml = "<gameInfo>";
			$xml .= "<player>";
			$xml .= "<money>" . $userInfo['Money'] . "</money>";	
			$xml .= "<production>" . $userInfo['Production'] . "</production>";
			$xml .= "<tier>" . $userInfo['Tier'] . "</tier>";
			
			if ($updateType == "Online" || $updateType == "BoughtItem") {
				$xml .= "<store>";
				$soldItems = get_items();
				foreach ($soldItems as $soldItem){
					$cost = get_cost($soldItem, 0);
					if (array_key_exists($soldItem, $userItems)){
						$cost = get_cost($soldItem, $userItems[$soldItem]["Quantity"]);
					}
					$xml .= "<item>";
					$xml .= "<name>" . $soldItem . "</name>";
					$xml .= "<production>" . get_production($soldItem) . "</production>";
					$xml .= "<cost>" . $cost . "</cost>";
					$xml .= "</item>";
				}
				$xml .= "</store>";
			}

			$xml .= "<bids>";
			$bids = get_bids($username);
			foreach ($bids as $bid){
				$xml .= "<bid>";
				$xml .= "<bidder>" . $bid["Bidder"] . "</bidder>";
				$xml .= "<amount>" . $bid["Bid"] . "</amount>";
				$xml .= "</bid>";
			}
			$xml .= "</bids>";
			
			$xml .= "<items>";
			foreach ($userItems as $item){
				$xml .= "<item>";
				$xml .= "<name>" . $item["Equipment"] . "</name>";
				$xml .= "<quantity>" . $item["Quantity"] . "</quantity>";
				$xml .= "<production>" . get_production($item["Equipment"]) . "</production>";
				$xml .= "</item>";
			}
			$xml .= "</items>";
			
			$xml .= "</player>";
			$xml .= "<employees>";
			foreach ($employeeInfo as $employee){
				$xml .= "<employee>";
				$xml .= "<name>" . $employee['Username'] . "</name>";
				$xml .= "<production>" . $employee['Production'] . "</production>";
				$xml .= "</employee>";
			}
			$xml .= "</employees>";
			
			$xml .= "<boss>";
			$xml .= "<name>" . $bossInfo["Username"] . "</name>";
			$xml .= "<production>" . $bossInfo['Production'] . "</production>";
			$xml .= "<tier>" . $bossInfo["Tier"] . "</name>";
			$xml .= "<items>";
			foreach ($bossItems as $item){
				$xml .= "<item>";
				$xml .= "<name>" . $item["Equipment"] . "</name>";
				$xml .= "<production>" . get_production($item["Equipment"]) . "</production>";
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
				clear_notifications($username);
			}
			$xml .= "</gameInfo>";	
		}
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
			case 5:
				$message = "You have a new job offer!";
				break;				
		}
		return $message;
	}
?>