$(document).ready(function(){
	/*画布基本设置 start*/
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();
	/*画布基本设置 end*/

	//游戏设置 用于确定是否运行动画代码
	var playGame;

	/*存储界面元素 start*/
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $(".gameReset");
	var uiScore = $(".gameScore");
	/*存储界面元素 end*/

	var soundBackground = $("#gameSoundBackground").get(0);
	var soundThrust = $("#gameSoundThrust").get(0);
	var soundDeath = $("#gameSoundDeath").get(0);


	//创建小行星
	var asteroids;
	var numAsteroids;
	//创建小行星类
	var Asteroid = function(x,y,radius,vX){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.vX = vX;
		this.miss = false;
	}

	//创建玩家使用的小火箭
	var player;
	var Player = function(x,y){
		this.x = x;
		this.y = y;
		this.width = 24;
		this.height = 24;
		this.halfWidth = this.width/2;
		this.halfHeight = this.height/2;
		this.vX = 0;
		this.vY = 0;

		this.moveRight = false;
		this.moveUp = false;
		this.moveDown = false;
		this.moveSpace = false;

		this.flameLength = 20;
	}
	//创建子弹
	var bullets;
	var Bullet  = function(x,y,radius){
		this.x = x;
		this.y = y;
		this.radius = radius;
	}

	var score;
	var scoreTimeout;

	//键盘上的箭头键值
	/*var arrowLeft = 37;*/
	var arrowUp = 38;
	var arrowRight = 39;
	var arrowDown = 40;
	var arrowSpace = 32;

	//重置和启动游戏
	function startGame(){
		//重置游戏状态
		uiScore.html("0");
		uiStats.show();

		//初始化
		playGame = false;

		//小行星
		asteroids = new Array();
		numAsteroids = 10;
		score = 0;
		for(var i = 0 ; i < numAsteroids ; i++){
			var radius = 5 + (Math.random()*10);
			var x = canvasWidth - radius - Math.floor(Math.random() * canvasWidth);
			var y = Math.floor(Math.random() * canvasHeight);
			var vX = -5 - (Math.random()*5);
			asteroids.push(new Asteroid(x,y,radius,vX));
		}
		//创建玩家使用的小火箭
		player = new Player(150,canvasHeight/2);
		bullets = new Array();

		//玩家使用小行星的键盘监听事件
		$(window).keydown(function(e){
			var keyCode = e.keyCode;
			if(!playGame){
				playGame = true;
				soundBackground.currentTime = 0;
				soundBackground.play();
				animate();
				timer();
			}
			if(keyCode == arrowRight){
				player.moveRight = true;
				if(soundThrust.paused){
					soundThrust.currentTime = 0;
					soundThrust.play();
				}
			}
			else if(keyCode == arrowUp)
				player.moveUp = true;
			else if(keyCode == arrowDown)
				player.moveDown = true;
			else if(keyCode == arrowSpace)
				player.moveSpace = true;
		});
		$(window).keyup(function(e){
			var keyCode = e.keyCode;
			if(keyCode == arrowRight){
				player.moveRight = false;
				soundThrust.pause();
			}
			else if(keyCode == arrowUp)
				player.moveUp = false;
			else if(keyCode == arrowDown)
				player.moveDown = false;
			else if(keyCode == arrowSpace)
				player.moveSpace = false;
		});
		animate();
	};

	//初始化游戏环境
	function init(){
		uiStats.hide();
		uiComplete.hide();
		uiPlay.click(function(e){
			e.preventDefault();
			uiIntro.hide();
			$(window).unbind("keyup");
			$(window).unbind("keydown");
			startGame();
		});
		uiReset.click(function(e){
			e.preventDefault();
			uiComplete.hide();
			soundThrust.pause();
			soundDeath.pause();
			soundBackground.pause();
			clearTimeout(scoreTimeout);
			startGame();
		});
	};

	function timer(){
		if(playGame){
			scoreTimeout = setTimeout(function(){
				uiScore.html(++score);
				if(score % 5 == 0)
					numAsteroids += 5;
				timer();
			},1000);
		}
	}

	//动画循环，游戏的趣味性就在这里
	function animate(){
		//清除
		context.clearRect(0,0,canvasWidth,canvasHeight);

		//画子弹
		context.fillStyle = "rgb(0,255,255)";
		var bulletsLength = bullets.length;
		for(var i = 0 ; i < bulletsLength ; i++){
			var tmpBullet = bullets[i];
			tmpBullet.x += 20;
			context.beginPath();
			context.arc(tmpBullet.x,tmpBullet.y,tmpBullet.radius,0,Math.PI*2,true);
			context.closePath();
			context.fill();
		}

		//画小行星
		var asteroidsLength = asteroids.length;
		for(var i = 0 ; i < asteroidsLength ; i++){
			var tmpAsteroid = asteroids[i];
			tmpAsteroid.x += tmpAsteroid.vX;
			context.fillStyle = "rgb(255,255,255)";
			if(tmpAsteroid.x + tmpAsteroid.radius < 0){
				if(!tmpAsteroid.miss)
					tmpAsteroid.radius = 5 + (Math.random() * 10);
				tmpAsteroid.x = canvasWidth + tmpAsteroid.radius;
				tmpAsteroid.y = Math.floor(Math.random() * canvasHeight);
				tmpAsteroid.vX = -5 - (Math.random() * 5);
			}
			//游戏结束碰撞检测
			var dX = player.x - tmpAsteroid.x;
			var dY = player.y - tmpAsteroid.y;
			var distance = Math.sqrt((dX * dX)+(dY * dY));
			if(distance < player.halfWidth + tmpAsteroid.radius && !tmpAsteroid.miss){
				soundThrust.pause();
				soundDeath.currentTime = 0;
				soundDeath.play();
				playGame = false;
				clearTimeout(scoreTimeout);
				uiStats.hide();
				uiComplete.show();
				soundBackground.pause();
				$(window).unbind("keyup");
				$(window).unbind("keydown");
			}
			//子弹碰撞检测
			var bulletsLength = bullets.length;
			for(var j = 0 ; j < bulletsLength ; j++){
				var tmpBullet = bullets[j];
				var dX = tmpBullet.x - tmpAsteroid.x;
				var dY = tmpBullet.y - tmpAsteroid.y;
				var distanceB = Math.sqrt((dX * dX)+(dY * dY));
				if(distanceB < tmpBullet.radius + tmpAsteroid.radius){
					tmpAsteroid.radius = 0;
					tmpBullet.radius = 0;
					tmpAsteroid.miss = true;
				}
			}

			context.beginPath();
			context.arc(tmpAsteroid.x,tmpAsteroid.y,tmpAsteroid.radius,0,Math.PI*2,true);
			context.closePath();
			context.fill();
		}

		//画小火箭
		player.vX = 0;
		player.vY = 0;
		if(player.moveRight)
			player.vX = 3;
		else
			player.vX = -3;
		if(player.moveUp)
			player.vY = -3;
		if(player.moveDown)
			player.vY = 3;
		if(player.moveSpace){
			var x = player.x;
			var y = player.y;
			var radius = 3;
			bullets.push(new Bullet(x,y,radius));
		}
		player.x += player.vX;
		player.y += player.vY;

		context.fillStyle = "rgb(255,0,0)";
		context.beginPath();
		context.moveTo(player.x+player.halfWidth,player.y);
		context.lineTo(player.x-player.halfWidth,player.y-player.halfHeight);
		context.lineTo(player.x-player.halfWidth,player.y+player.halfHeight);
		context.closePath();
		context.fill();

		if(player.x - player.halfWidth < 20)
			player.x = 20 + player.halfWidth;
		else if(player.x + player.halfWidth > canvasWidth - 20)
			player.x = canvasWidth - 20 - player.halfWidth;
		if(player.y - player.halfHeight < 20)
			player.y = 20 + player.halfHeight;
		else if(player.y + player.halfHeight > canvasHeight - 20)
			player.y = canvasHeight - 20 - player.halfHeight;

		if(player.moveRight){
			context.save();
			context.translate(player.x - player.halfWidth,player.y);
			if(player.flameLength == 20)
				player.flameLength = 15;
			else
				player.flameLength = 20;
			context.fillStyle = "orange";
			context.beginPath();
			context.moveTo(0,-5);
			context.lineTo(-player.flameLength,0);
			context.lineTo(0,5);
			context.closePath();
			context.fill();
			context.restore();

			while(asteroids.length < numAsteroids){
				var radius = 5 + (Math.random() * 10);
				var x = Math.floor(Math.random() * canvasWidth) + canvasWidth + radius;
				var y = Math.floor(Math.random() * canvasHeight);
				var vX = -5 - (Math.random() * 5);
				asteroids.push(new Asteroid(x,y,radius,vX));
			}
		}

		if(playGame){
			setTimeout(animate,33);
		}
	};
	
	init();
});