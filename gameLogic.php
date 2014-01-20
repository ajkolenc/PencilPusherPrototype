<?php
	include("database.php");
	
	$username = $_POST["username"];
	$userInfo = user_info($username);
	$bossInfo = user_info($userInfo["Boss"]);
	$returnInfo = "";
	
	$updateType = $_POST["update"];
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
	
	echo $returnInfo;
	
	function normal_update(){
		$updateTime = time() - $userInfo['LastUpdated'];
		$moneyEarned = $userInfo['Production'] * $updateTime;
		$userInfo['Money'] +=$moneyEarned;
		user_update($username, $userInfo['Money'], $userInfo['Production'], time());
		$returnInfo = generate_playerXML();
	}
	
	function online(){
		user_online($username);
	}
	
	function offline(){
		normal_update();
		user_online($username);
	}
	
	function interact(){
		$userInfo["Money"] += 1;
	};
	
	function accept_bid(){
		$bidder = $_POST['Bidder'];
		$bid = get_bid($username, $bidder);
		$bidAmount = $bid['Bid'];
		$userInfo['Money'] += $bidAmount;
		normal_update();
		remove_bid($username, $bidder);
		
		$userInfo['Boss'] = $bidder;
		new_boss($username, $bidder);
	}
	
	function reject_bid(){
		normal_update();
		remove_bid($username, $bidder);	
	}
	
	function bought_item(){
		normal_update();
		$item = $_POST['NewItem'];		
		switch ($item){
			case "Pen":
				$userInfo["Money"] -= 5;
				$userInfo["Production"] += 1;
				break;
			case "Typewriter":
				$userInfo["Money"] -= 100;
				$userInfo["Production"] += 5;
				break;
			case "Word Processor":
				$userInfo["Money"] -= 1500;
				$userInfo["Production"] += 100;
				break;
		}
		new_equipment($username, $item);
		user_update($username, $userInfo['Money'], $userInfo['Production'], time());
	}
	
	function generate_playerXML(){
		$xml = "<gameInfo>";
		$xml = "<player>";
		$xml .= "<money>" . $userInfo['Money'] . "</money>";	
		$xml .= "<production>" . $userInfo['Production'] . "</production>";
		if ($updateType == "Online" || $updateType == "RejectBid" || $updateType == "AcceptBid"){
			$xml .= "<bids>";
			$bids = get_bids();
			foreach ($bids as $bid){
				$xml .= "<bid>";
				$xml .= "<bidder>" . $bid["Bidder"] . "</bidder>";
				$xml .= "<amount>" . $bid["Bid"] . "</amount>";
				$xml .= "</bid>";
			}
			$xml .= "</bids>";
			$xml .= "<boss>" . $userInfo['Boss'] . "</boss>";
		}
		if ($updateType == "Online" || $updateType == "BoughtItem"){
			$xml .= "<items>";
			$items = get_equipment();
			foreach ($items as $item){
				$xml .= "<item>";
				$xml .= "<name>" . $item["Equipment"] . "</name>";
				$xml .= "<quantity>" . $item["Quantity"] . "</quantity>";
				$xml .= "</item>";
			}
			$xml .= "</items>";
		}
		$xml.= "</player>";
		$xml.= "</gameInfo>";
	}
?>