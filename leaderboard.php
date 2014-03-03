<html>
<head>
<style>
body
{
	font-family: Courier New;
	width: 600px;
	margin: 0 auto;
	margin-top: 20px;
}
</style>
</head>
<body>
<h1>Pencil Pusher</h1>
<h2>Leaderboard</h2>
<table style="min-width: 50vw;">
	<tr>
		<td><h3 style="width: 20vw;">Money</h3></td>
		<td style="width: 20vw;"><h3>Production</h3></td>
	</tr>
	<?php
		include("database.php");
		
		$users = get_all_members();
		
		$moneyBoard = insertion_sort($users, "Money");
		$prodBoard = insertion_sort($users, "Production");
		
		for ($i = 0; $i < count($users); $i++){
			$user1 = $moneyBoard[$i];
			$user2 = $prodBoard[$i];
			echo "<tr>";
			echo "<td>" . $user1["Username"] . "</td>";
			echo "<td>" . $user2["Username"] . "</td>";
			echo "</tr>";
		}
		
		function insertion_sort($arr, $key){
			$newArr = array();
			for ($i = 0; $i < count($arr); $i++){
				$element = $arr[$i];
				$index = 0;
				for ($j = 0; $j < count($newArr); $j++){
					$el = $newArr[$j];
					if ($element[$key] > $el[$key]){
						break;
					}
					$index++;
				}
				array_splice($newArr, $index, 0, array($element));
			}
			return $newArr;
		}
	?>
</table>
</body>
</html>