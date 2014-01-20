<?php
	$server = "127.0.0.1";
	$user = "root";
	$password = "";
	$database = "pencilpusher";
	$con = mysqli_connect($server, $user, $password, $database);
		
	if (mysqli_connect_errno()){
		echo "<p> ERROR </p>";
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
		$pass = md5($password);
		$query = "INSERT INTO employees VALUES ('$username','$pass', '$money', '$production','$boss');";
		database_query($query);
	}

	function has_equipment($username, $equipment){
		$query = "SELECT * FROM employee_equipment WHERE Username='$username' AND Equipment='$equipment'";
		if (mysqli_fetch_array(database_query($query))){
			return true;
		}
		else {
			return false;
		}
	}
	
	function new_equipment($username, $equipment){
		$query = "INSERT INTO employee_equipment VALUES ('$username', '$equipment', '1')";
		
		$quantity = has_equipment($username, $equipment);
		if ($quantity > 0){
			$quantity++;
			$query = "UPDATE employee_equipment SET Quantity='$quantity', WHERE Username='$username' AND Equipment='$equipment';";
		}
		
		database_query($query);
	}
	
	function new_boss($username, $boss){
		$query = "UPDATE employees SET Boss='$boss' WHERE Username='$username';";
		database_query($query);		
	}
	
	function user_update($username, $money, $production, $timestamp){
		$query = "UPDATE employees SET Money='$money', Production='$production', LastUpdate='$timestamp' WHERE Username='$username';";
		database_query($query);	
	}
	
	function user_online($username, $timestamp){
		$query = "UPDATE employees SET LastUpdate='$timestamp', Online='1' WHERE Username='$username';";
		database_query($query);
	}
	
	function user_offline($username, $timestamp){
		$query = "UPDATE employees SET LastUpdate='$timestamp', Online='0' WHERE Username='$username';";
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
				$arr[] = $row;
			}
		}
		return $arr;
	}	
	
	function delete_member($username){
		$query = "DELETE FROM employees WHERE Username='$username';";
		database_query($query);
	}
	
	function get_bid($username, $bidder){
		$query = "SELECT * FROM employee_bids WHERE Username='$username' AND Bidder='$bidder';";
		return mysqli_fetch_assoc(database_query($query));
	}
	
	function get_bids($username){
		$query = "SELECT * FROM employee_bids WHERE Username='$username';";
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
	
	function database_query($query){
		global $con;
		return mysqli_query($con, $query);
	}
	
	function close_database(){
		mysqli_close($con);
	}
?>