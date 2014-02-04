<?php
	include("database.php");
	$username = $_POST["Username"];
	$password = $_POST["Password"];
	$boss = $_POST["Boss"];
	if ($boss == ""){
		$boss = "The Boss";
	}
	
	new_user($username, $password, 0, 0, $boss);
	echo "<p>Registered $username with password $password.</p>";
?>