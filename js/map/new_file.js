clip:{
	data:{
		
	},
	tempData:[],
	//执行分割
	doClip:function(){
		var data=this.getClipData();
		console.log(data);
		return;
		var server=[],local=[];
		var corssData=this.getCrossPoints();
		if(corssData===false){
			//console.log('没有线数据了，结束');
			this.clear();
			return;
		}

		var targets=[];
		//遍历线和所有面的交点数据
		for(var k=0;k<corssData.length;k++){
			var node=corssData[k].clipTarget;
			//清理原有节点
			this.data.delArea.push(node);
			edObj.mapBg.removeChild(node);
			var pData=mapPolygon.clearPathPtLink(node);
			server=server.concat(pData.server);
			local=local.concat(pData.local);
			edObj.curNode.splice(edObj.curNode.indexOf(node),1);
			mapDetails.showSelPolygon();//多边形详情
			edObj.keyStatus.isCtrl=oldIsCtrl;
		}
		//清理执行完毕的线
		edObj.mapBg.removeChild(this.data[0].node);
		this.data[0]=null;
		this.data.splice(0,1);
		//如果还有线，继续执行
		if(this.data.length>1){
			this.doClip();
		}else{
			//清理过程中生成后又被再次分割的数据
			var data=this.data,
				upds=data.updArea,
				adds=data.allArea,
				dels=data.delArea;
			for(var i=adds.length-1;i>-1;i--){
				for(var j=dels.length-1;j>-1;j--){
					if(adds[i]==dels[j]){
						adds.splice(i,1);
						dels.splice(j,1);
						break;
					}
				}
			}
			for(var i=upds.length-1;i>-1;i--){
				ltemp.type='update';
				ltemp.from=JSON.stringify(node.mapData);
				ltemp.to=JSON.stringify(node.mapData);
				server.push({//上传服务器数据
					type:'updateArea',
					data:mapServerData.getDataFromNode('addArea',upds[i])
				});
				local.push(ltemp)
			}
			for(var i=adds.length-1;i>-1;i--){
				server.push({//上传服务器数据
					type:'addArea',
					data:mapServerData.getDataFromNode('addArea',adds[i])
				});
				local.push({
					type:'add',
					data:JSON.stringify(adds[i].mapData),
				})
			}
			for(var i=dels.length-1;i>-1;i--){
				server.push({//上传服务器数据
					type:'delArea',
					data:mapServerData.getDataFromNode('delArea',dels[i])
				});
				local.push({
					type:'delete',
					data:JSON.stringify(dels[i].mapData),
				});
			}
			mapHistory.appendHistory({
				name:'分割',
				server:server,
				local:local
			});
			this.clear();
		}
		//this.clear();
	},
	//获取交点坐标
	getCrossPoints:function(){
		if(edObj.curNode.length<1||!this.data||this.data.length<2){
			return false;
		}
		var clipPts=[];
		for(var i=0;i<2;i++){
			clipPts.push({
				x:this.data[i].x+edObj.width/2,
				y:this.data[i].y+edObj.height/2
			});
		}
		var data=[];
		for(var i=0;i<clipPts.length;i++){
			if(i==clipPts.length-1){
				break;
			}
			var a=clipPts[i];
			var b=clipPts[i+1];
			
			for(var k=0;k<edObj.curNode.length;k++){
				if(edObj.curNode[k].mapData.locked==true){//锁定判定
					continue;
				}
				var lineData={
					clipTarget:edObj.curNode[k],
					start:a,
					end:b,
					crossPts:[]
				}
				var points=edObj.curNode[k].mapData.posData.points;
				for(var j=0;j<points.length;j++){
					var c=points[j];
					var d;
					if(j<points.length-1){
						d=points[j+1];
					}else{
						d=points[0];
					}
					var pt=mapMath.getPointFromLine2(a,b,c,d);//获取线段ab和cd的交点
					if(pt){
						var crossData={
							point:pt,
							from:{
								index:j,
								x:c.x,
								y:c.y
							},
							to:{
								index:j<points.length-1?j+1:0,
								x:d.x,
								y:d.y
							}
						}
						lineData.crossPts.push(crossData);
					}
				}
				if(lineData.crossPts.length>1){//一条线在区域中至少两个交点才能开始分割
					lineData.crossPts.sort(function(a,b){
						return a.to.index-b.to.index;
					})
					data.push(lineData);
				}
			}
		}
		return data;
	},
	//确定分割
	Ok:function(){
		if(!this.data){
			return;
		}
		this.data.allArea=[];
		this.data.delArea=[];
		this.doClip();
		//this.clear();
	},
	//绘制点
	printPoint:function(point){
		if(!this.data){
			this.data=[];
		}
		point.x=Math.round(point.x);
		point.y=Math.round(point.y);

		var temp={};
		temp.node=new PIXI.Graphics();
		temp.x=point.x;
		temp.y=point.y;
		temp.node.beginFill(0x00ffff);
		if(this.data.length>0){
			var lastPoint=this.data[this.data.length-1];
			temp.node.lineStyle(2,0x00ffff);
			temp.node.moveTo(lastPoint.x,lastPoint.y);
			temp.node.lineTo(point.x,point.y);
		}
		temp.node.drawCircle(point.x,point.y,5);
		temp.node.endFill();
		//temp.visible=true;
		
		edObj.mapBg.addChild(temp.node);
		this.data.push(temp);
		if(this.data.length>1){
			this.data.allArea=[];
			this.data.delArea=[];
			this.doTempClip();
		}
	},
	//获取分割数据
	getClipData:function(){
		var corssData=this.getCrossPoints();
		if(corssData===false){
			//console.log('没有线数据了，结束');
			this.clear();
			return;
		}

		var targets=[];
		//遍历线和所有面的交点数据
		for(var k=0;k<corssData.length;k++){
			var node=corssData[k].clipTarget;
			var points=node.mapData.posData.points;
			//在面的点位数组中插入分割点位
			for(var i=corssData[k].crossPts.length-1;i>-1;i--){
				var temp={
					x:corssData[k].crossPts[i].point.x,
					y:corssData[k].crossPts[i].point.y,
					clip:true
				};
				points.push(temp);
				mapMath.moveAryItem(points,points.length-1,corssData[k].crossPts[i].to.index);
			}
			console.log("points",points);
			//分割点位数组
			var clipArys=[]
			var temp=[];
			for(var i=0;i<points.length;i++){
				temp.push(points[i]);
				if(points[i].clip){
					clipArys.push(JSON.parse(JSON.stringify(temp)));
					temp=[];
					temp.push(points[i]);
				}
				if(i==points.length-1&&!points[i].clip){
					clipArys.push(JSON.parse(JSON.stringify(temp)));
				}
			}
			clipArys[0]=clipArys[clipArys.length-1].concat(clipArys[0]);
			clipArys.splice(clipArys.length-1,1);
			//清理数组中的clip属性
			for(var i=0;i<clipArys.length;i++){
				for(var j=0;j<clipArys[i].length;j++){
					if(clipArys[i][j].clip){
						clipArys[i][j]={
							x:clipArys[i][j].x,
							y:clipArys[i][j].y
						};
					}
				}
			}
			//根据分割数组添加新增区域
			for(var i=0;i<clipArys.length;i++){
				targets.push({
					points:clipArys[i],
					color:node.mapData.color,
				});
			}
		}
		return targets;
	},
	doTempClip:function(){
		var clipData=this.getClipData();
		if(!clipData||clipData.length<2){
			return;
		}
		for(var i=0;i<clipData.length;i++){
			var node=this.appendTemp({
				points:clipData[i].points,
				color:clipData[i].color
			});
			this.bindTempEvent(node);
			edObj.mapBg.addChild(node);
			this.tempData.push(node);
		}
		console.log(this.tempData);
	},
	/*
	 * 添加临时分割节点
	 * points:点位数组
	 * color:颜色
	 */
	appendTemp:function(obj){
		var points=obj.points,
			color=obj.color;
		color=color||'0x000000';
		var temp=new PIXI.Graphics();
		temp.beginFill(color);
		temp.lineStyle(2,0x00ff00);
		temp.mapData={};
		
		var rect=mapMath.getRectFromPointsArys([points])

		var centerX=rect.width/2;
		var centerY=rect.height/2;
		temp.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		for(var i=1;i<points.length;i++){
			temp.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
		}
		temp.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		temp.mapData.type='clipTempPolygon';
		
		//数据处理
		
		temp.mapData.posData={
			x:rect.left,
			y:rect.top,
			center:{
				x:centerX,
				y:centerY
			},
			points:points
		}

		//数据处理end
		temp.endFill();
		temp.alpha=0.7;
		temp.x=rect.left-edObj.width/2+centerX;
		temp.y=rect.top-edObj.height/2+centerY;
		return temp;
	},
	//临时多边形事件
	bindTempEvent:function(node){
		
	},
	//清空
	clear:function(){
		if(!this.data){
			return;
		}
		this.tempData=[];
		this.data.delArea=null;
		this.data.newArea=null;
		for(var i=0;i<this.data.length;i++){
			edObj.mapBg.removeChild(this.data[i].node);
			this.data[i]=null;
		}
		this.data=null;
	}
},