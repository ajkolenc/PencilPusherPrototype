<html>
<body>
	<h1>Tester</h1>
	<p>Choose Action</p>
	<form action="gameLogic.php" method="post">
	<input type="hidden" name="Username" value="Test User 1"></input>
	<input type="radio" name="UpdateType" value="Online">Online</input>
	<input type="radio" name="UpdateType" value="NormalUpdate">Update</input>
	<input type="hidden" name="NewItem" value="Pen"></input>
	<input type="radio" name="UpdateType" value="BoughtItem">Buy Pen</input>
	<input type="radio" name="UpdateType" value="EmployeeInfo">Get info of "The Boss"</input>
	<input type="hidden" name="Employee" value="The Boss"></input>
	<input type="radio" name="UpdateType" value="Offline">Offline</input><br/><br/>
	<input type="submit"></input>
	</form>
</body>
</html>
