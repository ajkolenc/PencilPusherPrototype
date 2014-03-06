<?php
//	$server = "web-db1.gatech.edu";
	$server = "mysql.localhost";
	$user = "theboss";
	$password = "pyramidscheme";
	$database = "pencil_pusher";
	
//	$server = "127.0.0.1";
//	$user = "root";
//	$password = "";
//	$database = "pencilpusher";

	$con = mysqli_connect($server, $user, $password, $database);
	
	if (mysqli_connect_errno()){
		echo "<p> ERROR " . mysqli_connect_error() . "</p>";
	}

	function database_connected(){
		return !mysqli_connect_errno();
	}
	
	function user_exists($username){
		$query = "SELECT * FROM employees WHERE Username='$username'";
		if (mysqli_fetch_array(database_query($query))){
			return true;
		}
		else {
			return false;
		}
	}
	
	function user_auth($username, $password){
		$pass = md5($password);
		$query = "SELECT * FROM members WHERE username='$username' AND password='$pass'";
		if (mysqli_fetch_array(database_query($query))){
			return true;
		}
		else {
			return false;
		}
	}
	
	function user_info($username){
		$query = "SELECT * FROM employees WHERE Username='$username'";
		return mysqli_fetch_assoc(database_query($query));
	}
	
	function new_user($username, $password, $money, $production, $boss){
		$bossInfo = user_info($boss);
		$tier = $bossInfo['Tier'] + 1;
		$pass = md5($password);
		$date = time();
		$query = "INSERT INTO employees VALUES ('$username','$pass', '$money', '$production', '$production', '100', '$boss', FROM_UNIXTIME('$date'), '0', '$tier', FROM_UNIXTIME('$date'), '0');";
		database_query($query);
	}

	function has_equipment($username, $equipment){
		$query = "SELECT * FROM employee_equipment WHERE Username='$username' AND Equipment='$equipment'";
		$info = mysqli_fetch_assoc(database_query($query));
		if ($info){
			return $info["Quantity"];
		}
		else {
			return 0;
		}
	}
	
	function new_equipment($username, $equipment){
		$query = "INSERT INTO employee_equipment VALUES ('$username', '$equipment', '1')";
		
		$quantity = has_equipment($username, $equipment);

		if ($quantity > 0){
			$quantity += 1;
			$query = "UPDATE employee_equipment SET Quantity='$quantity' WHERE Username='$username' AND Equipment='$equipment';";
		}
		
		database_query($query);
	}
	
	function get_all_members(){
		$query = "SELECT * FROM employees;";
		$result = database_query($query);
		$arr = array();
		if ($result){
			while ($row = mysqli_fetch_assoc($result)){
				$arr[] = $row;
			}
		}
		return $arr;		
	}
	
	function new_boss($username, $boss){
		$bossInfo = user_info($boss);
		$tier = $bossInfo['Tier'] + 1;
		$query = "UPDATE employees SET Boss='$boss', Tier='$tier' WHERE Username='$username';";
		database_query($query);
	}
	
	function user_update($username, $money, $maxproduction, $production, $tier, $timestamp, $onlineTime){
		$query = "UPDATE employees SET Money='$money', MaxProduction='$maxproduction', Production='$production', Tier='$tier', LastUpdated=FROM_UNIXTIME('$timestamp'), TimeOnline='$onlineTime' WHERE Username='$username';";
		database_query($query);
	}
	
	function update_boss($username, $money, $maxproduction, $production){
		$query = "UPDATE employees SET Money='$money', MaxProduction='$maxproduction', Production='$production' WHERE Username='$username';";
		database_query($query);
	}
	
	function user_online($username, $timestamp){
//		$query = "UPDATE employees SET Online='1' WHERE Username='$username';";
		$query = "UPDATE employees SET LastUpdated=FROM_UNIXTIME('$timestamp'), Online='1' WHERE Username='$username';";
		database_query($query);
	}
	
	function user_offline($username, $timestamp){
		$query = "UPDATE employees SET LastUpdated=FROM_UNIXTIME('$timestamp'), Online='0' WHERE Username='$username';";
		database_query($query);
	}

	function reset_user($username){
		$info = user_info($username);
		$pass = $info["Password"];
		$boss = $info["Boss"];
		$tier = $info["Tier"];
		delete_user($username);
		$date = time();
		$query = "INSERT INTO employees VALUES ('$username', '$pass', '0', '0', '$boss', FROM_UNIXTIME('$date'), '0', '$tier');";
		database_query($query);
	}

	function get_employees($boss){
		$query = "SELECT * FROM employees WHERE Boss='$boss';";
		$result = database_query($query);
		$arr = array();
		if ($result){
			while ($row = mysqli_fetch_assoc($result)){
				$arr[] = $row;
			}
		}
		return $arr;
	}
	
	function get_equipment($username){
		$query = "SELECT * FROM employee_equipment WHERE Username='$username';";
		$result = database_query($query);
		$arr = array();
		if ($result){
			while ($row = mysqli_fetch_assoc($result)){
				$arr[$row["Equipment"]] = $row;
			}
		}
		return $arr;
	}
	
	function delete_user($username){
		$query = "DELETE FROM employees WHERE Username='$username';";
		database_query($query);
		$query = "DELETE FROM employee_bids WHERE Employee='$username';";
		database_query($query);
		$query = "DELETE FROM employee_equipment WHERE Username='$username';";
		database_query($query);
		$query = "DELETE FROM notifications WHERE Username='$username';";
		database_query($query);
	}
	
	function new_bid($username, $employee, $bidAmount){
		$query = "INSERT INTO employee_bids Values ('$username', '$employee', '$bidAmount');";
		return database_query($query);
	}

	function get_bid($username, $bidder){
		$query = "SELECT * FROM employee_bids WHERE Username='$username' AND Bidder='$bidder';";
		return mysqli_fetch_assoc(database_query($query));
	}
	
	function get_bids($username){
		$query = "SELECT * FROM employee_bids WHERE Employee='$username';";
		$result = database_query($query);
		$arr = array();
		if ($result){
			while ($row = mysqli_fetch_assoc($result)){
				$arr[] = $row;
			}
		}
		return $arr;
	}

	function remove_bid($bidder, $username){
		$query = "DELETE FROM employee_bids WHERE Username='$username' AND Bidder='$bidder';";
		database_query($query);
	}
	
	function notify_user($username, $sender, $code, $variable){
		$query = "INSERT INTO notifications VALUES ('$username', '$sender', '$code', '$variable');";
		database_query($query);	
	}
	
	function get_notifications($username){
		$query = "SELECT * FROM notifications WHERE Username='$username';";
		$result = database_query($query);
		$arr = array();
		if ($result){
			while ($row = mysqli_fetch_assoc($result)){
				$arr[] = $row;
			}
		}
		return $arr;
	}
	
	function clear_notifications($username){
		$query = "DELETE FROM notifications WHERE Username='$username';";
		database_query($query);		
	}
	
	function database_query($query){
		global $con;
		return mysqli_query($con, $query);
	}
	
	function close_database(){
		mysqli_close($con);
	}
?>