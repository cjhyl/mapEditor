var mapPolygon={
	myStyle:{
		borderWidth:2,
		borderColor:'0x000000',
		fillColor:'FFFFFF',
	},
	//编辑增加点位
	editAddPoint:{
		data:{
			tempPt:null
		},
		//绘制临时点
		paintTempPt:function(point){
			var crossData=this.getCrossData(point);
			if(!crossData){
				this.removeTempPt();
				return;
			}
			//排除同状态下的编辑点、缩放点、旋转点的拖动行为的干扰
			if(edObj.doing=='polygonEditPointMove'
			||edObj.doing=='polygonScalePointMove'
			||edObj.doing=='polygonRotPointMove'){
				return;
			}
			var node=edObj.curNode[0];
			if(node.mapData.locked==true){//锁定判定
				return;
			}

			var temp;
			if(!this.data.tempPt){
				var temp=new PIXI.Graphics();
			}else{
				temp=this.data.tempPt;
				temp.clear();
			}
			temp.beginFill(0xffff00);
			temp.lineStyle(2,0x000000);
			temp.drawCircle(0,0,10);
			temp.x=crossData.cross.x-edObj.width/2;
			temp.y=crossData.cross.y-edObj.height/2;
			temp.mapData={
				x:crossData.cross.x,
				y:crossData.cross.y,
				start:crossData.start,
				end:crossData.end
			};
			temp.endFill();
			
			if(!this.data.tempPt){
				temp.mapData.type='tempAddPoint';
				this.bindEvent(temp);
				this.data.tempPt=temp;
				edObj.mapBg.addChild(temp);
			}
		},
		//移除临时点
		removeTempPt:function(){
			if(this.data.tempPt){
				edObj.mapBg.removeChild(this.data.tempPt);
				this.data.tempPt=null;
			}
		},
		//获取点与线的交点数据
		getCrossData:function(point){
			if(edObj.curNode.length<1){
				return;
			}
			
			var pos={
				x:point.x+edObj.width/2,
				y:point.y+edObj.height/2
			};
			var node=edObj.curNode[0];
			if(node.mapData.locked==true){//锁定判定
				return;
			}
			var points=JSON.parse(JSON.stringify(node.mapData.posData.points));
			var dirData={
				d:9999,
				cross:{x:0,y:0}
			};
			for(var i=0;i<points.length;i++){
				var next=i+1;
				if(next>points.length-1){
					next=0;
				}
				//生成点和已有点太近
				
				//两点重合的情况
				if(points[i].x==points[next].x&&points[i].y==points[next].y){
					continue;
				}
				var temp=mapMath.getDirFromPointToLine(pos,points[i],points[next]);
				//遍历选择出最近的垂线相交的线并返回数据
				if(temp.d<dirData.d&&temp.isInLine){
					dirData=temp;
					dirData.start=i;
					dirData.end=next;
				}
			}
			//没找到符合要求的点
			if(dirData.d==9999){
				return;
			}
			//生成点和已有点的距离太近
			for(var i=0;i<points.length;i++){
				if(mapMath.getDirFromPoint2(dirData.cross,points[i])<mapTopMenu.setDatas.gravityRad){
					return;
				}
			}
			//与线的距离足够近的时候
			if(dirData.d<mapTopMenu.setDatas.gravityRad){
				return dirData;
			}
		},
		//绑定事件
		bindEvent:function(node){
			var that=this;
			node.interactive=true;
			//点击临时点
			node.on('click',function(){
				that.add(this);//添加点
				that.removeTempPt();//移除临时点
			});
		},
		//执行加点操作
		add:function(node){
			
			var addData=node.mapData;
			var node=edObj.curNode[0];
			var ltemp={};
			ltemp.type='update';
			ltemp.from=JSON.stringify(node.mapData);
			var points=JSON.parse(JSON.stringify(node.mapData.posData.points));
			points.push({
				x:addData.x,
				y:addData.y
			});
			mapMath.moveAryItem(points,points.length-1,addData.start+1);
			
			mapPolygon.repaintRect(node,points);
			mapDetails.showSelPolygon();//多边形详情
			mapPolygon.updateOldData(node);
			ltemp.to=JSON.stringify(node.mapData);
			var server=[{
				type:'updateArea',
				data:mapServerData.getDataFromNode('updateArea',node)
			}];
			var local=[ltemp];
			mapHistory.appendHistory({
				name:'加点',
				server:server,
				local:local
			});
			
			/*mapServerData.changeServer({//上传服务器数据
				type:'updateArea',
				data:mapServerData.getDataFromNode('updateArea',node)
			});*/
		}
	},
	//重绘多边形
	repaintRect:function(node,points,color){
		var operType='resize';
		if(node.mapData.posData.points.length!=points.length){
			operType='changePoint';
		}
		color=color||node.mapData.color||0x000000;
		node.clear();
		node.beginFill(color);
		node.lineStyle(1,0x000000);
		
		var rect=mapMath.getRectFromPointsArys([points]);

		var centerX=rect.width/2;
		var centerY=rect.height/2;
		node.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		for(var j=1;j<points.length;j++){
			node.lineTo(points[j].x-rect.left-centerX,points[j].y-rect.top-centerY);
		}
		node.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		node.mapData.color=color;
		node.mapData.posData={
			x:rect.left,
			y:rect.top,
			center:{
				x:centerX,
				y:centerY
			},
			points:points
		}
		node.endFill();
		node.rotation=0;
		node.x=rect.left-edObj.width/2+centerX;
		node.y=rect.top-edObj.height/2+centerY;
		this.pathPtMove(node);
		if(operType=='resize'){
			this.rePosChildren(node);
		}else if(operType=='changePoint'){
			this.editNodeMode(node,true);
		}
	},
	//重新定位多边形子元素的
	rePosChildren:function(node){
		//var data=node.mapData.posData.points;
		var posData=node.mapData.posData;
		
		//编辑点位
		var pointNodes=node.children.filter(function(node){
			return node.areaChildType=='editPoint';
		});
		var innerPoints=[];
		for(var i=0;i<posData.points.length;i++){
			var x=posData.points[i].x-posData.x-posData.center.x;
			var y=posData.points[i].y-posData.y-posData.center.y;
			innerPoints.push({
				x:x,
				y:y
			});
		}
		for(var i=0;i<innerPoints.length;i++){
			pointNodes[i].x=innerPoints[i].x;
			pointNodes[i].y=innerPoints[i].y;
		}
		//编辑点位end
		
		//文本节点
		/*var textNode=node.children.filter(function(node){
			return node.areaChildType=='label';
		});
		if(textNode&&textNode.length>0){
			textNode.text=txt;
			textNode.style=style;
			textNode[0].x=-textNode[0].width/2;
			textNode[0].y=0-textNode[0].style.fontSize/2;
		}*/
		//文本节点end
		
		this.areaScale.repos(node);//缩放点位位置重置
		this.areaRot.repos(node);//旋转点位位置重置
	},
	//更新多边形位置数据type 'move' 'rot'
	updatePolygonPos:function(type,node){
		if(type=='move'){
			var posData=node.mapData.posData;
			var oldx=posData.x-edObj.width/2+posData.center.x;
			var oldy=posData.y-edObj.height/2+posData.center.y;
			var newx=node.x;
			var newy=node.y;
			var difx=newx-oldx;
			var dify=newy-oldy;
			for(var i=0;i<posData.points.length;i++){
				posData.points[i].x+=difx;
				posData.points[i].y+=dify;
			}
			posData.x=newx+edObj.width/2-posData.center.x;
			posData.y=newy+edObj.height/2-posData.center.y;
			mapDetails.showSelPolygon();//多边形详情
			
			return;
		}
		if(type=='rot'){
			var posData=node.mapData.posData;
			var rotCenter={
				x:posData.x+posData.center.x,
				y:posData.y+posData.center.y
			};
			var angel=node.rotation;
			var points=posData.points.map(function(item){
				return {
					x:item.x,
					y:item.y
				};
			});
			var newPoints=[];
			for(var i=0;i<points.length;i++){
				newPoints.push(mapMath.pointArcMove(points[i],rotCenter,angel));
			}
			
			this.repaintRect(node,newPoints);
			mapDetails.showSelPolygon();//多边形详情
		}
	},
	//开启、关闭编辑模式
	editNodeMode:function(node,isOpen){
		if(isOpen){
			//node.removeChildren();
			var notEditPoint=node.children.filter(function(item){
				if(item.areaChildType=='editPoint'){
					return false;
				}
				if(item.areaChildType.indexOf('scalePoint')!=-1){
					return false;
				}
				if(item.areaChildType.indexOf('rotPoint')!=-1){
					return false;
				}
				return true;
			});
			node.children=notEditPoint;
			var posData=node.mapData.posData;
			var innerPoints=[];
			for(var i=0;i<posData.points.length;i++){
				innerPoints.push({
					x:posData.points[i].x-posData.x-posData.center.x,
					y:posData.points[i].y-posData.y-posData.center.y
				});
			}
			this.editPoint.addPoint(node,innerPoints);
			this.areaScale.addPoint(node);
			this.areaRot.addPoint(node);
		}else{
			this.editPoint.removePoint(node);
			this.areaScale.removePoint(node);
			this.areaRot.removePoint(node);
		}
	},
	//选中多边形 bSelect强制执行选中操作
	selectNode:function(node,bSelect){
		/*var status=edObj.status.value;
		var edStatus=$('input[name="editStatus"]:checked').val();
		if(status=="editEle"&&(edStatus=="editStatus_addPoint"||edStatus=="editStatus_clip")&&!bSelect){//增加点位和编辑时禁止手动选中。
			return;
		}*/
		if(bSelect===false){
			node.mapData.selected=false;
			mapPath.updatePointStyle(node,false);
			//node.alpha=1;
			this.paintSelectNode(node,false)
			this.editNodeMode(node,false);
			var idx=edObj.curNode.indexOf(node);
			edObj.curNode.splice(idx,1);
			return;
		}else if(bSelect===true){
			node.mapData.selected=true;
			mapPath.updatePointStyle(node,true);
			//node.alpha=1;
			this.paintSelectNode(node,true)
			this.editNodeMode(node,true);
			var idx=edObj.curNode.indexOf(node);
			if(idx==-1){
				edObj.curNode.push(node);
			}
			return;
		}
		var isSame=false;
		for(var i=0;i<edObj.curNode.length;i++){
			if(edObj.curNode[i]===node){
				isSame=true;
				break;
			}
		}
		if(edObj.keyStatus.isCtrl===false){//单选
			if(isSame){
				return;
			}
			var childs=this.getPolygons();
			edObj.curNode=[];
			for(var i=0;i<childs.length;i++){
				if(childs[i]===node){//选择
					node.mapData.selected=true;
					mapPath.updatePointStyle(node,true);
					//node.alpha=0.5;
					this.paintSelectNode(childs[i],true);
					edObj.curNode[0]=node;
					this.editNodeMode(edObj.curNode[0],true);
					//$('.detailBg').html(JSON.stringify(node.mapData.posData));
				}else if(childs[i].mapData&&childs[i].mapData.selected==true){//取消选择
					childs[i].mapData.selected=false;
					mapPath.updatePointStyle(childs[i],false);
					//childs[i].alpha=1;
					this.paintSelectNode(childs[i],false);
					this.editNodeMode(childs[i],false);
				}
			}
		}else{//多选
			if(isSame){
				for(var i=0;i<edObj.curNode.length;i++){
					if(edObj.curNode[i]===node){//取消选择
						node.mapData.selected=false;
						mapPath.updatePointStyle(node,false);
						//node.alpha=1;
						this.paintSelectNode(node,false);
						this.editNodeMode(node,false);
						var idx=edObj.curNode.indexOf(node);
						edObj.curNode.splice(idx,1);
						break;
					}
				}
			}else{//选择
				node.mapData.selected=true;
				mapPath.updatePointStyle(node,true);
				//node.alpha=0.5;
				this.paintSelectNode(node,true);
				edObj.curNode.push(node);
				this.editNodeMode(node,true);
			}
		}
		mapDetails.showSelPolygon();//多边形详情
	},
	paintSelectNode:function(node,isSel){
		var color=node.mapData.color,
			points=node.mapData.posData.points;
		if(isSel){
			node.clear();
			node.beginFill(node.mapData.color);
			node.lineStyle(6,0xFF0000);
			var rect=mapMath.getRectFromPointsArys([points]);
			var centerX=rect.width/2;
			var centerY=rect.height/2;
			node.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			for(var j=1;j<points.length;j++){
				node.lineTo(points[j].x-rect.left-centerX,points[j].y-rect.top-centerY);
			}
			node.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			node.endFill();
		}else{
			node.clear();
			node.beginFill(node.mapData.color);
			node.lineStyle(1,0x000000);
			var rect=mapMath.getRectFromPointsArys([points]);
			var centerX=rect.width/2;
			var centerY=rect.height/2;
			node.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			for(var j=1;j<points.length;j++){
				node.lineTo(points[j].x-rect.left-centerX,points[j].y-rect.top-centerY);
			}
			node.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			node.endFill();
		}
	},
	getPolygons:function(){
		var polygons=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return item.mapData.type=='polygon';
			}else{
				return false;
			}
		});
		return polygons;
	},
	//多边形事件
	bindEvent:function(node){
		var that=this;
		node.interactive=true;
		//拖拽
		/*node.on('click',function(){
			if(edObj.status.value=='editPath'){
				return;
			}
			that.selectNode(this);
		})*/
		node.on('mousedown',function(e){
			if(edObj.operStatus=='oper_click'){
				e.stopPropagation();
			}
			//点击状态
	    	if(edObj.operStatus=='oper_click'){
	    		this.parent.children.forEach(function(item){
		    		item.isMousDown=false;
		    	});
		    	this.isMousDown=true;
		    	var ptThat=this;
		    	setTimeout(function(){//规定时间内鼠标抬起才算点击
		    		if(ptThat.isMousDown===true){
		    			ptThat.isMousDown=false;
		    		}
		    	},edObj.clickTime);
	    	}
	    	
	    	//拖拽开始
			if (!this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this)!=-1) {
				if(this.mapData.locked==true){//锁定判定
					return;
				}
				dragStart(e,this);
				/*var isSel=false;
				for(var i=0;i<edObj.curNode.length;i++){
					if(edObj.curNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragStart(e,this,function(node){
						for(var i=0;i<edObj.curNode.length;i++){
							if(edObj.curNode[i]!=node){
								edObj.curNode[i].startPi={};
								edObj.curNode[i].startPi.x=edObj.curNode[i].x;
								edObj.curNode[i].startPi.y=edObj.curNode[i].y;
							}
						}
					});
				}else{//未选中拖动(单体)
					dragStart(e,this);
				}*/
			}
		});
		node.on('mousemove',function(e){
			//拖拽中
			if (this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this)!=-1) {
				if(this.mapData.locked==true){//锁定判定
					return;
				}
				dragMove(e,this,function(node){
					that.pathPtMove(node);
				});
				/*var isSel=false;
				for(var i=0;i<edObj.curNode.length;i++){
					if(edObj.curNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragMove(e,this,function(node){
						that.pathPtMove(node);
						var difX=node.x-node.startPi.x;
						var difY=node.y-node.startPi.y;
						for(var i=0;i<edObj.curNode.length;i++){
							if(edObj.curNode[i]!=node){
								that.pathPtMove(edObj.curNode[i]);
								edObj.curNode[i].x=edObj.curNode[i].startPi.x+difX;
								edObj.curNode[i].y=edObj.curNode[i].startPi.y+difY;
							}
						}
					});
				}else{//未选中拖动(单体)
					dragMove(e,this,function(node){
						that.pathPtMove(node);
					});
				}*/
			}
		});
		node.on('mouseup',function(e){
			if(edObj.operStatus=='oper_click'){
				e.stopPropagation();
			}
			//点击状态
	    	if(edObj.operStatus=='oper_click'){
	    		if(this.isMousDown===true){//点击判定
					that.selectNode(this);
				}
	    	}

			//拖拽结束
			if (this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this)!=-1) {
				if(this.mapData.locked==true){//锁定判定
					return;
				}
				dragEnd(e,this,function(node){
					var ltemp={};
					ltemp.type='update';
					ltemp.from=JSON.stringify(node.mapData);

					that.pathPtMove(node);
					node.startPi=null;
					mapPolygon.updatePolygonPos('move',node);
					mapPolygon.updateOldData(node);

					ltemp.to=JSON.stringify(node.mapData);
					var server=[{
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node)
					}];
					var local=[ltemp];
					mapHistory.appendHistory({
						name:'移动',
						server:server,
						local:local
					});
					/*mapServerData.changeServer({//上传服务器数据
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node)
					});*/
				});
				/*var isSel=false;
				for(var i=0;i<edObj.curNode.length;i++){
					if(edObj.curNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragEnd(e,this,function(node){
						for(var i=0;i<edObj.curNode.length;i++){
							that.pathPtMove(edObj.curNode[i]);
							edObj.curNode[i].startPi=null;
							mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
						}
						mapHistory.appendHistory('移动');
					});
				}else{//未选中拖动(单体)
					dragEnd(e,this,function(node){
						that.pathPtMove(node);
						mapPolygon.updatePolygonPos('move',node);
						mapHistory.appendHistory('移动');
					});
				}*/
			}
		});
		//拖拽end
	},
	//添加多边形
	/*
	 * points:点位数组
	 * color:颜色
	 * areaId:区域id
	 * PointID:路径点id
	 * pathPt:路径点位置
	 * pathLinks:路径连接数组
	 * oldData:老编辑器数据
	 */
	append:function(obj){
		var points=obj.points,
			color=obj.color,
			areaId=obj.areaId,
			PointID=obj.PointID,
			pathPt=obj.pathPt,
			pathLinks=obj.pathLinks;
		color=color||'0x000000';
		var temp=new PIXI.Graphics();
		temp.beginFill(color);
		temp.lineStyle(mapPolygon.myStyle.borderWidth,mapPolygon.myStyle.borderColor);
		temp.mapData={};
		
		var rect=mapMath.getRectFromPointsArys([points])

		var centerX=rect.width/2;
		var centerY=rect.height/2;
		temp.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		for(var i=1;i<points.length;i++){
			temp.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
		}
		temp.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		temp.mapData.type='polygon';
		temp.mapData.color=color;
		//数据处理
		if(areaId){
			temp.mapData.areaId=areaId;
		}else{
			temp.mapData.areaId='AREA-'+mapMath.formatTimespan(edObj.uid)+'-'+parseInt(Math.random()*4000);;
			edObj.uid++;
		}
		temp.mapData.posData={
			x:rect.left,
			y:rect.top,
			center:{
				x:centerX,
				y:centerY
			},
			points:points
		}
		if(pathPt){
			temp.mapData.path={
				PointID:PointID,
				x:pathPt.x,
				y:pathPt.y
			};
		}else{
			temp.mapData.path={
				PointID:'POINT-'+mapMath.formatTimespan(edObj.uid)+'-'+parseInt(Math.random()*4000),
				x:rect.left+centerX,
				y:rect.top+centerY
			};
			edObj.uid++;
		}
		if(temp.mapData.path){
			if(pathLinks&&pathLinks.length>0){
				temp.mapData.path.links=pathLinks;
			}else{
				temp.mapData.path.links=[];
			}
		}
		/*
		//区域参数
		var updateArea={
			"AreaTypeID":"-1",
			"TextColor":"0x000000",
			"TextMapping":"False",
			"IconMapping":"False",
			"Area":"737,2562|1026,2562|1026,2381|1026,2352|1026,2097|1026,2097|1006,2089|987,2082|967,2076|948,2070|929,2065|911,2061|892,2059|873,2057|855,2056|836,2057|818,2059|799,2061|781,2066|763,2071|744,2078|744,2562",
			"PointID":"POINT-20180912-10:55:14:117-7818",
			"IconRotate":"0",
			"FloorID":"72180629-BB50-435A-AB19-D0563C892F0D",
			"TextRotate":"0",
			"IconScale":"1",
			"Name":"0",
			"FontSize":"14",
			"AreaID":"AREA-20180912-10:55:14:117-2252",
			"Remark":"",
			"Acreage":"0",
			"TextDispayType":"2",
			"CPointID":"896,2164",
			"Color":"0xdbe000",
			"TextX":"0",
			"BuildingID":"13F78A98-FF92-4821-AA7C-1A99BB1C1FB8",
			"TextY":"0",
			"TextW":"36",
			"TextH":"12",
			"IconX":"0",
			"IconY":"0",
			
			"Remark":"",
			"IsDamage":"",
			"RemoteOfflineType":"manual",
			"BID":"13F78A98-FF92-4821-AA7C-1A99BB1C1FB8",
		}
		//路径点参数
		var updatePoint={
			"Name":"",
			"RemoteOfflineType":"manual",
			"PointID":"POINT-20180912-10:55:14:117-7818",
			"BID":"13F78A98-FF92-4821-AA7C-1A99BB1C1FB8",
			"Y":2165,
			"FloorID":"72180629-BB50-435A-AB19-D0563C892F0D",
			"X":896
		};*/
		if(obj.oldData){
			temp.mapData.oldData=obj.oldData;
		}else{
			temp.mapData.oldData={};
			temp.mapData.oldData.area={
				Area:points.map(function(item){
						return item.x+','+item.y;
				}).join('|'),
				AreaID:temp.mapData.areaId,
				BuildingID:mapServerData.data.BID,
				FloorID:mapServerData.data.FloorID,
				PointID:temp.mapData.path.PointID,
				PointX:temp.mapData.path.x,
				PointY:temp.mapData.path.y,
				CPointID:(temp.mapData.posData.x+temp.mapData.posData.center.x)+','+(temp.mapData.posData.y+temp.mapData.posData.center.y),
				Color:color,
				Acreage:"0",
				AreaTypeID:"-1",
				AreaTypeName:"",
				Code:null,
				DownLogo:"",
				FontSize:"14",
				IconMapping:false,
				IconRotate:"0",
				IconScale:"1",
				IconX:"0",
				IconY:"0",
				Lan:"sc",
				Logo:"",
				Map_AreaID:0,
				Name:"0",
				ShopID:"",
				Tag:"",
				TextColor:"0x000000",
				TextDispayType:"2",
				TextH:"12",
				TextMapping:false,
				TextRotate:"0",
				TextW:"36",
				TextX:"0",
				TextY:"0",
				ThirdPartyID:"",
				ThreeDDepth:null,
			}
			temp.mapData.oldData.point={
				PointID:temp.mapData.path.PointID,
				X:temp.mapData.path.x,
				Y:temp.mapData.path.y,
				FloorID:mapServerData.data.FloorID,
				Project:mapServerData.data.pid,
				Code:null,
				Name:""
			}
		}
		//数据处理end
		temp.endFill();
		temp.alpha=0.8;
		temp.x=rect.left-edObj.width/2+centerX;
		temp.y=rect.top-edObj.height/2+centerY;
		this.bindEvent(temp);
		edObj.mapBg.addChild(temp);
		if(temp.mapData.oldData.area.AreaTypeName=='地形'){//地形弄到底层
			mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,0);
		}
		this.appendPathPt(temp);
		return temp;
	},
	//添加多边形路径点
	appendPathPt:function(pNode){
		var temp={},
			ptData=pNode.mapData.path,
			links=ptData.links,
			pos={
				x:ptData.x,
				y:ptData.y,
			};
		temp=new PIXI.Graphics();
		
		//图标
		var oArea=pNode.mapData.oldData.area;
		if(oArea.Logo){
			var url=mapServerData.data.href+oArea.Logo
			mapMath.getBase64FromUrl(url,function(b64){
				var tempIco=PIXI.Sprite.fromImage(b64);
				tempIco.anchor.set(0.5);
				tempIco.x=0;
				tempIco.y=0;
				tempIco.areaSubType='icon';
				temp.addChild(tempIco);
				
				mapMath.moveAryItem(temp.children,temp.children.length-1,0);
				if(!oArea.IconMapping){
					tempIco.visible=false;
				}
			});
		}
		//图标end
		
		//寻路点
		var tempPt=new PIXI.Graphics();
		tempPt.beginFill(mapPath.myStyle.nodeColor);
		
		tempPt.lineStyle(mapPath.myStyle.pathWidth,mapPath.myStyle.pathColor);
		var linkNodes=[];
		if(links&&links.length>0){
			linkNodes=mapMath.getNodeFromIds(links);
		}
		for(var i=0;i<linkNodes.length;i++){
			var targetX=linkNodes[i].mapData.posData.x,
				targetY=linkNodes[i].mapData.posData.y;
			if(linkNodes[i].mapData.type=='polygon'){
				targetX=linkNodes[i].mapData.path.x,
				targetY=linkNodes[i].mapData.path.y;
			}
			tempPt.moveTo(0,0);
			tempPt.lineTo(targetX-pos.x,targetY-pos.y);
		}
		
		tempPt.lineStyle (2,0x000000);
		tempPt.arc(0,0,edObj.pointRad*2-2);
		tempPt.drawCircle(0,0,edObj.pointRad*2);
		tempPt.areaSubType='point';
		
		tempPt.endFill();
		temp.addChild(tempPt);
		//寻路点 end
		
		temp.x=pos.x-pNode.mapData.posData.x-pNode.mapData.posData.center.x;
		temp.y=pos.y-pNode.mapData.posData.y-pNode.mapData.posData.center.y;
		temp.visible=true;
		temp.mapData={};
		temp.mapData.PointID=pNode.mapData.path.PointID;
		
		temp.areaChildType='polyPath';
		this.pathPtEvent(temp);
		
		pNode.addChild(temp);
		linkNodes.forEach(function(item){
			var thisPtData=mapMath.getPathPointData(item);
			if(thisPtData.links.indexOf(temp.mapData.PointID)==-1){
				thisPtData.links.push(temp.mapData.PointID)
			}
			/*if(item.mapData.type=='path'){
				item.mapData.links.push(temp.mapData.uid);
			}else if(item.mapData.type=='polygon'){
				item.mapData.path.links.push(temp.mapData.uid);
			}*/
		});
		return temp;
	},
	pathPtEvent:function(node){
		var that=this;
		node.interactive=true;
		//拖拽
	    node.on('mousedown',function(e){
	    	if(this.parent.mapData.locked==true){//锁定判定
				return;
			}
	    	e.stopPropagation();
	    	if (!this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this.parent)!=-1) {
	    		this.ltempFrom=JSON.stringify(this.parent.mapData);
	    		dragStart(e,this);
		    }
		});
		node.on('mousemove',function(e){
			if(this.parent.mapData.locked==true){//锁定判定
				return;
			}
			if (this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this.parent)!=-1) {
	    		dragMove(e,this,function(){
	    			that.pathPtMove(node);
	    		});
		   	}
		});
		node.on('mouseup',function(e){
			if(this.parent.mapData.locked==true){//锁定判定
				return;
			}
			e.stopPropagation();
			if (this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this.parent)!=-1) {
	    		dragEnd(e,this,function(node){
					var ltemp={};
					ltemp.type='update';
					ltemp.from=node.ltempFrom;
					that.pathPtMove(node);
					mapPolygon.updateOldData(node.parent);

					ltemp.to=JSON.stringify(node.parent.mapData);
					var server=[{
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node.parent)
					}];
					var local=[ltemp];
	    			mapHistory.appendHistory({
						name:'多边形路径点移动',
						server:server,
						local:local
					});
					/*mapServerData.changeServer({//上传服务器数据
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node.parent)
					});*/
	    		});
		   	}
		});
		node.on('mouseupoutside',function(e){
			if(this.parent.mapData.locked==true){//锁定判定
				return;
			}
			e.stopPropagation();
			if (this.dragging&&edObj.operStatus=='oper_click'&&edObj.curNode.indexOf(this.parent)!=-1) {
	    		dragEnd(e,this,function(node){
					var ltemp={};
					ltemp.type='update';
					ltemp.from=node.ltempFrom;
					
					that.pathPtMove(node);
					mapPolygon.updateOldData(node.parent);
					
					ltemp.to=JSON.stringify(node.parent.mapData);
					var server=[{
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node.parent)
					}];
					var local=[ltemp];
	    			mapHistory.appendHistory({
						name:'多边形路径点移动',
						server:server,
						local:local
					});
					/*mapServerData.changeServer({//上传服务器数据
						type:'updateArea',
						data:mapServerData.getDataFromNode('updateArea',node.parent)
					});*/
	    		});
		   	}
		});
	},
	//多边形移动时的路径点数据更新
	pathPtMove:function(node){
		if(node.mapData.type!='polygon'){
			cNode=node;
			pNode=cNode.parent;
		}else{
			pNode=node;
			cNode=pNode.children.filter(function(item){
				return item.areaChildType=='polyPath';
			})[0];
		}
		pNode.mapData.path.x=pNode.x+edObj.width/2+cNode.x;
		pNode.mapData.path.y=pNode.y+edObj.height/2+cNode.y;
		mapPath.updatePointStyle(pNode);
		var links=pNode.mapData.path.links;
		var linkNodes=[];
		if(links&&links.length>0){
			linkNodes=mapMath.getNodeFromIds(links);
			/*linkNodes=edObj.mapBg.children.filter(function(item){
				var isLink=false;
				if(item.mapData&&(item.mapData.type=='path'||item.mapData.type=='polygon')&&links.indexOf(item.mapData.uid)!=-1){
					isLink=true;
				}
				return isLink;
			});*/
		}
		for(var i=0;i<linkNodes.length;i++){
			mapPath.updatePointStyle(linkNodes[i]);
		}
	},
	//清理路径点连接数据
	clearPathPtLink:function(node){
		var ptData=mapMath.getPathPointData(node),
			PointID=ptData.PointID,
			links=ptData.links,
			server=[],
			local=[];
		if(links&&links.length>0){
			var pts=mapMath.getNodeFromIds(links);
			for(var i=0;i<pts.length;i++){
				var ltemp={};
				ltemp.type='update';
				ltemp.from=JSON.stringify(pts[i].mapData);

				var target=mapMath.getPathPointData(pts[i]);
				var targetLinks=target.links;
				var idx=targetLinks.indexOf(PointID);
				targetLinks.splice(idx,1);
				mapPath.updatePointStyle(pts[i]);
				
				ltemp.to=JSON.stringify(pts[i].mapData);
				server.push({
					type:'delPath',
					data:mapServerData.getDataFromNode('delPath',{
						sid:PointID,
						eid:target.PointID
					},true)
				});
				local.push(ltemp);
				/*(function(i){
					mapServerData.changeServer({
						type:'delPath',
						data:mapServerData.getDataFromNode('delPath',{
							sid:PointID,
							eid:target.PointID
						})
					});
				})(i)*/
			}
			
		}
		return {
			server:server,
			local:local
		};
	},
	//绘制多边形
	print:{
		data:null,
		tempRect:null,
		tempLine:null,
		//确定添加区域
		Ok:function(){
			if(!this.data){
				return;
			}
			if(!mapServerData.data.FloorID){
				this.clear();
				showToast({
					title:'请选择楼层'
				});
				return;
			}
			var points=[];
			for(var i=0;i<this.data.length;i++){
				if(this.data[i].visible){
					points.push({
						x:this.data[i].x+edObj.width/2,
						y:this.data[i].y+edObj.height/2
					});
				}
			}
			if(points.length<1){return;}
			points.length=points.length-1;
			var node=mapPolygon.append({
				points:points,
				color:mapPolygon.myStyle.fillColor,
			});
			var server=[{
				type:'addArea',
				data:mapServerData.getDataFromNode('addArea',node)
			}];
			var local=[{
				type:'add',
				data:JSON.stringify(node.mapData)
			}]
			mapHistory.appendHistory({
				name:'绘制',
				server:server,
				local:local
			});
			/*mapServerData.changeServer({//上传服务器数据
				type:'addArea',
				data:mapServerData.getDataFromNode('addArea',node)
			});*/
			this.clear();
		},
		//通过输入框指定坐标添加点
		addPointFromInput:function(){
			var xbox=$('#printPolygon_x');
			var ybox=$('#printPolygon_y');
			var x=parseFloat(xbox.val())-edObj.width/2;
			var y=parseFloat(ybox.val())-edObj.height/2;
			if(x!=x||y!=y){
				return;
			}
			this.printPoint({
				x:x,
				y:y
			});
			xbox.val('');
			ybox.val('');
		},
		//历史点位记录
		updateLog:function(){
			var logHtml='历史点位：';
			if(this.data){
				logHtml+='<br>'
				for(var i=0;i<this.data.length;i++){
					var x=this.data[i].x+edObj.width/2;
					var y=this.data[i].y+edObj.height/2;
					if(this.data[i].visible){
						logHtml+='['+i+']:'+x+','+y+'<br>';
					}else{
						logHtml+='<span style="color:#f00">['+i+']:'+x+','+y+'</span><br>';
					}
				}
			}
			$('#printPolygon_log').html(logHtml);
		},
		//绘制点
		printPoint:function(point){
			if(!this.data){
				this.data=[];
			}
			point.x=Math.round(point.x);
			point.y=Math.round(point.y);
			
			//吸附操作
			var sameIdx=-1;
			for(var i=0;i<this.data.length;i++){
				var dir=mapMath.getDirFromPoint2(point,{x:this.data[i].x,y:this.data[i].y});
				if(dir<mapTopMenu.setDatas.gravityRad){
					point={
						x:this.data[i].x,
						y:this.data[i].y
					};
					sameIdx=i;
					break;
				}
			}

			//清理历史记录中的无效点
			this.data=this.data.filter(function(item){
				if(!item.visible){
					edObj.mapBg.removeChild(item.node);
					item=null;
				}
				return item!=null;
			});
			//清理历史记录中的无效点 end

			var temp={};
			temp.node=new PIXI.Graphics();
			temp.x=point.x;
			temp.y=point.y;
			temp.node.beginFill(0xff0000);
			if(this.data.length>0){
				var lastPoint=this.data[this.data.length-1];
				temp.node.lineStyle(2);
				temp.node.moveTo(lastPoint.x,lastPoint.y);
				temp.node.lineTo(point.x,point.y);
			}
			temp.node.drawCircle(point.x,point.y,5);
			temp.node.endFill();
			temp.visible=true;
			
			edObj.mapBg.addChild(temp.node);
			this.data.push(temp);
			this.paintTempRect();
			this.updateLog();
			
			var that=this;
			if(sameIdx===0){
				that.Ok();
				/*showConfirm({
					title:'已经闭环，是否生成多边形？',
					btns:['生成','继续绘制'],
					callback:function(idx){
						if(idx===0){
							that.Ok();
						}
					}
				});*/
			}
		},
		//清空
		clear:function(){
			if(!this.data){
				return;
			}
			for(var i=0;i<this.data.length;i++){
				edObj.mapBg.removeChild(this.data[i].node);
				this.data[i]=null;
			}
			if(this.tempRect){
				edObj.mapBg.removeChild(this.tempRect);
			}
			if(this.tempLine){
				edObj.mapBg.removeChild(this.tempLine);
			}
			this.data=null;
			this.tempRect=null;
			this.tempLine=null;
			this.updateLog();
		},
		//上一步
		back:function(){
			if(!this.data){
				return;
			}
			var idx=this.data.length-1;
			for(var i=0;i<this.data.length;i++){
				if(this.data[i].visible===false&&i>0){
					idx=i-1;
					//this.data[i-1].visible=false;
					//this.data[i-1].node.visible=false;
					break;
				}
			}
			this.data[idx].visible=false;
			this.data[idx].node.visible=false;
			this.paintTempRect();
			this.updateLog();
		},
		//下一步
		front:function(){
			if(!this.data){
				return;
			}
			var idx=0;
			for(var i=0;i<this.data.length;i++){
				if(this.data[i].visible===false&&i<this.data.length){
					idx=i;
					//this.data[i-1].visible=true;
					//this.data[i-1].node.visible=true;
					break;
				}
			}
			this.data[idx].visible=true;
			this.data[idx].node.visible=true;
			this.paintTempRect();
			this.updateLog();
		},
		//绘制临时多边形
		paintTempRect:function(){
			if(!this.data){
				return;
			}
			if(!this.tempRect){
				this.tempRect=new PIXI.Graphics();
				edObj.mapBg.addChild(this.tempRect);
			}
			var color=mapPolygon.myStyle.fillColor;
			this.tempRect.clear();
			this.tempRect.beginFill(color);
			this.tempRect.lineStyle(0);
			var points=this.data.filter(function(item){
				return item.visible;
			});
			if(points.length<1){
				return;
			}
			points=points.map(function(item){
				return {
					x:item.x+edObj.width/2,
					y:item.y+edObj.height/2
				}
			});
			this.tempRect.mapData={};
			
			var rect=mapMath.getRectFromPointsArys([points]);

			var centerX=rect.width/2;
			var centerY=rect.height/2;
			this.tempRect.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			for(var i=1;i<points.length;i++){
				this.tempRect.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
			}
			this.tempRect.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			this.tempRect.mapData.type='tempPolygon';
			this.tempRect.mapData.color=color;
			this.tempRect.mapData.posData={
				x:rect.left,
				y:rect.top,
				center:{
					x:centerX,
					y:centerY
				},
				points:points
			}
			this.tempRect.endFill();
			this.tempRect.alpha=0.5;
			this.tempRect.x=rect.left-edObj.width/2+centerX;
			this.tempRect.y=rect.top-edObj.height/2+centerY;
		},
		//绘制临时虚线
		paintTempLine:function(pt){
			if(!this.data){
				return;
			}
			var points=this.data.filter(function(item){
				return item.visible;
			});
			if(points.length<1){
				return;
			}
			var sp=points[points.length-1];
			
			//吸附效果
			for(var i=0;i<this.data.length;i++){
				var dir=mapMath.getDirFromPoint2(pt,{x:this.data[i].x,y:this.data[i].y});
				if(dir<mapTopMenu.setDatas.gravityRad){
					pt={
						x:this.data[i].x,
						y:this.data[i].y
					};
					break;
				}
			}
			
			if(!this.tempLine){
				this.tempLine=new PIXI.Graphics();
				edObj.mapBg.addChild(this.tempLine);
			}
			var color=mapPolygon.myStyle.fillColor;
			this.tempLine.clear();
			this.tempLine.beginFill(color);
			this.tempLine.lineStyle(2,0xff0000,0.3);
			
			this.tempLine.mapData={};
			
			var rect=mapMath.getRectFromPointsArys([points]);

			this.tempLine.moveTo(0,0);
			this.tempLine.lineTo(pt.x-sp.x,pt.y-sp.y);
			this.tempLine.mapData.type='tempLine';

			this.tempLine.endFill();
			this.tempLine.x=sp.x;
			this.tempLine.y=sp.y;
		}
	},
	
	//编辑点
	editPoint:{
		//添加编辑点
		addPoint:function(node,data){
			for(var i=0;i<data.length;i++){
				var temp=new PIXI.Graphics();
				temp.beginFill(0x000000);
				temp.drawCircle(0,0,10);
				temp.endFill();
				temp.x=data[i].x;
				temp.y=data[i].y;
				temp.areaChildType='editPoint';
				temp.mapData={};
				temp.mapData.selected=false;
				if(edObj.operStatus!='oper_click'){
					temp.visible=false;
				}
				node.addChild(temp);
				this.bindEvent(temp);
			}
		},
		removePoint:function(node){
			var childs=node.children;
			for(var i=childs.length-1;i>-1;i--){
				if(childs[i].areaChildType.indexOf('editPoint')!=-1){
					node.removeChild(childs[i]);
				}
			}
		},
		//删除点
		deletePoint:function(pt){
			var node=pt.parent,
				pts=node.children.filter(function(item){
					return item.areaChildType=='editPoint';
				});
			var idx=pts.indexOf(pt);
			var points=JSON.parse(JSON.stringify(node.mapData.posData.points));
			points.splice(idx,1);
			mapPolygon.repaintRect(node,points);
			for(var i=0;i<node.children.length;i++){
				var child=node.children[i];
				if(child.areaChildType=='editPoint'&&child.mapData.selected==true){
					child.mapData.selected=false;
					child.clear();
					child.beginFill(0x000000);
					child.drawCircle(0,0,10);
					child.mapData.selected=false;
					child.endFill();
				}
			}
		},
		//绑定编辑点事件
		bindEvent:function(node){
			var that=this;
			node.interactive=true;
			//拖拽
		    node.on('mousedown',function(e){
		    	if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
		    	e.stopPropagation();
		    	//点击判定
		    	this.parent.children.forEach(function(item){
		    		item.isMousDown=false;
		    	});
		    	this.isMousDown=true;
		    	var ptThat=this;
		    	setTimeout(function(){//规定时间内鼠标抬起才算点击
		    		if(ptThat.isMousDown===true){
		    			ptThat.isMousDown=false;
		    		}
		    	},edObj.clickTime);
		    	
		    	
		    	if (!this.dragging&&this.mapData.selected==true) {
		    		dragStart(e,this,function(){
		    			
		    		});
			    }
			});
			node.on('mousemove',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				if (this.dragging) {
					edObj.doing='polygonEditPointMove';
		    		dragMove(e,this,function(node){
		    			that.paintTempRect(node.parent);
		    		});
			   }
			});
			node.on('mouseup',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if(this.isMousDown===true){//点击判定
					that.select(this);
				}
				if (this.dragging) {
					edObj.doing=null;
					that.removeTempRect(node.parent);
		    		dragEnd(e,this,function(node){
		    			var points=[];
						var nodeParent=node.parent;
						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(nodeParent.mapData);

						for(var i=0;i<nodeParent.children.length;i++){
							if(nodeParent.children[i].areaChildType=="editPoint"){
								points.push({
									x:nodeParent.x+edObj.width/2+nodeParent.children[i].x,
									y:nodeParent.y+edObj.width/2+nodeParent.children[i].y
								})
							}
							
						};
						mapPolygon.repaintRect(nodeParent,points);
						mapPolygon.updateOldData(nodeParent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(node.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',nodeParent)
						}];
						var local=[ltemp];
		    			mapHistory.appendHistory({
							name:'变形',
							server:server,
							local:local
						});
						
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',nodeParent)
						//});
		    		});
			   }
			});
			node.on('mouseupoutside',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (this.dragging) {
					edObj.doing=null;
					that.removeTempRect(node.parent);
		    		dragEnd(e,this,function(node){
		    			var points=[];
						var nodeParent=node.parent;
						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(nodeParent.mapData);

						for(var i=0;i<nodeParent.children.length;i++){
							if(nodeParent.children[i].areaChildType=="editPoint"){
								points.push({
									x:nodeParent.x+edObj.width/2+nodeParent.children[i].x,
									y:nodeParent.y+edObj.width/2+nodeParent.children[i].y
								})
							}
							
						};
						mapPolygon.repaintRect(nodeParent,points);
						mapPolygon.updateOldData(nodeParent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(node.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',nodeParent)
						}];
						var local=[ltemp];
		    			mapHistory.appendHistory({
							name:'变形',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',nodeParent)
						//});
		    		});
			   }
			});
		},
		select:function(node,bSel){
			var pNode=node.parent,
				nodes=pNode.children.filter(function(item){
					return item.areaChildType=="editPoint";
				});
			for(var i=0;i<nodes.length;i++){
				if(nodes[i]!=node&&nodes[i].mapData.selected==true){
					nodes[i].clear();
					nodes[i].beginFill(0x000000);
					nodes[i].drawCircle(0,0,10);
					nodes[i].mapData.selected=false;
				}else if(nodes[i]==node){
					nodes[i].clear();
					nodes[i].beginFill(0xff0000);
					nodes[i].lineStyle(2,0x000000);
					nodes[i].drawCircle(0,0,10);
					nodes[i].mapData.selected=true;
				}
			}
		},
		getSelPt:function(node){
			var selPt=[],
				edPts=node.children.filter(function(item){
					return item.areaChildType=="editPoint";
				});
			for(var i=0;i<edPts.length;i++){
				if(edPts[i].mapData.selected==true){
					selPt.push(edPts[i]);
					break;
				}
			}
			return selPt;
		},
		paintTempRect:function(node){
			var edPts=node.children.filter(function(item){
					return item.areaChildType=="editPoint";
				});
			var points=edPts.map(function(item){
				return {
					x:item.x,
					y:item.y
				}
			});
			console.log(points);
			var oldRect=node.children.filter(function(item){
				return item.areaChildType=="editTempRect";
			});
			var tmRect;
			if(oldRect.length<1){
				tmRect=new PIXI.Graphics();
			}else{
				tmRect=oldRect[0];
				tmRect.clear();
			}
			tmRect.beginFill(0xffffff,0);
			tmRect.lineStyle(1,0xff0000);
			tmRect.moveTo(points[0].x,points[0].y);
			for(var i=1;i<points.length;i++){
				tmRect.lineTo(points[i].x,points[i].y);
			}
			tmRect.lineTo(points[0].x,points[0].y);
			tmRect.endFill();
			if(oldRect.length<1){
				tmRect.areaChildType="editTempRect";
				node.addChild(tmRect);
			}
		},
		removeTempRect:function(node){
			var tempRect=node.children.filter(function(item){
				return item.areaChildType=="editTempRect";
			})[0];
			if(tempRect){
				node.removeChild(tempRect);
			}
		},
		show:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('editPoint')!=-1){
						childs[i].visible=true;
					}
				}
			}
		},
		hide:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('editPoint')!=-1){
						childs[i].visible=false;
					}
				}
			}
		}
	},
	//区域缩放
	areaScale:{
		data:{
			l:15,
		},
		addPoint:function(node){
			var nodePos=node.mapData.posData;
			var rect=mapMath.getRectFromPointsArys([nodePos.points]);
			rect.left=rect.left-nodePos.x-nodePos.center.x;
			rect.top=rect.top-nodePos.y-nodePos.center.y;
			rect.right=rect.right-nodePos.x-nodePos.center.x;
			rect.bottom=rect.bottom-nodePos.y-nodePos.center.y;
			var pos=[
				{x:rect.left,y:rect.top,pos:'topLeft',},
				{x:0,y:rect.top,pos:'top'},
				{x:rect.right,y:rect.top,pos:'topRight'},
				{x:rect.right,y:0,pos:'right'},
				{x:rect.right,y:rect.bottom,pos:'bottomRight'},
				{x:0,y:rect.bottom,pos:'bottom'},
				{x:rect.left,y:rect.bottom,pos:'bottomLeft'},
				{x:rect.left,y:0,pos:'left'}
			];
			
			for(var i=0;i<pos.length;i++){
				var temp=new PIXI.Graphics();
				this.doPaint(temp,pos[i].pos,rect);
				temp.x=pos[i].x;
				temp.y=pos[i].y;
				temp.areaChildType='scalePoint_'+pos[i].pos;
				if(edObj.operStatus!='oper_click'){
					temp.visible=false;
				}
				node.addChild(temp);
				this.scalePointEvent(temp);
			}
		},
		//重新根据区域数据定位拉伸点
		repos:function(node){
			var nodePos=node.mapData.posData;
			var rect=mapMath.getRectFromPointsArys([nodePos.points]);
			rect.left=rect.left-nodePos.x-nodePos.center.x;
			rect.top=rect.top-nodePos.y-nodePos.center.y;
			rect.right=rect.right-nodePos.x-nodePos.center.x;
			rect.bottom=rect.bottom-nodePos.y-nodePos.center.y;
			var pos=[
				{x:rect.left,y:rect.top,pos:'topLeft',},
				{x:0,y:rect.top,pos:'top'},
				{x:rect.right,y:rect.top,pos:'topRight'},
				{x:rect.right,y:0,pos:'right'},
				{x:rect.right,y:rect.bottom,pos:'bottomRight'},
				{x:0,y:rect.bottom,pos:'bottom'},
				{x:rect.left,y:rect.bottom,pos:'bottomLeft'},
				{x:rect.left,y:0,pos:'left'}
			];
			var points=node.children.filter(function(cd){
				return cd.areaChildType.indexOf('scalePoint')!=-1;
			})
			for(var i=0;i<pos.length;i++){
				var temp=points.filter(function(pt){
					return pt.areaChildType.split('_')[1]==pos[i].pos;
				})[0];
				temp.clear();
				this.doPaint(temp,pos[i].pos,rect);
				temp.x=pos[i].x;
				temp.y=pos[i].y;
			}
		},
		//拉伸点拉伸时的框体位置变化
		resizeRect:function(pt,type,x,y){
			var node=pt.parent;
			var nodePos=node.mapData.posData;
			var rect=mapMath.getRectFromPointsArys([nodePos.points]);
			rect.left=rect.left-nodePos.x-nodePos.center.x;
			rect.top=rect.top-nodePos.y-nodePos.center.y;
			rect.right=rect.right-nodePos.x-nodePos.center.x;
			rect.bottom=rect.bottom-nodePos.y-nodePos.center.y;
			if(type=='topLeft'){
				rect.left=x;
				rect.top=y;
			}
			if(type=='top'){
				rect.top=y;
			}
			if(type=='topRight'){
				rect.right=x;
				rect.top=y;
			}
			if(type=='right'){
				rect.right=x;
			}
			if(type=='bottomRight'){
				rect.right=x;
				rect.bottom=y;
			}
			if(type=='bottom'){
				rect.bottom=y;
			}
			if(type=='bottomLeft'){
				rect.left=x;
				rect.bottom=y;
			}
			if(type=='left'){
				rect.left=x;
			}
			rect.width=rect.right-rect.left;
			rect.height=rect.bottom-rect.top;
			rect.mdX=rect.left+rect.width/2;
			rect.mdY=rect.top+rect.height/2;
			var pos=[
				{x:rect.left,y:rect.top,pos:'topLeft',},
				{x:rect.mdX,y:rect.top,pos:'top'},
				{x:rect.right,y:rect.top,pos:'topRight'},
				{x:rect.right,y:rect.mdY,pos:'right'},
				{x:rect.right,y:rect.bottom,pos:'bottomRight'},
				{x:rect.mdX,y:rect.bottom,pos:'bottom'},
				{x:rect.left,y:rect.bottom,pos:'bottomLeft'},
				{x:rect.left,y:rect.mdY,pos:'left'}
			];
			var points=node.children.filter(function(cd){
				return cd.areaChildType.indexOf('scalePoint')!=-1;
			})
			for(var i=0;i<pos.length;i++){
				var temp=points.filter(function(pt){
					return pt.areaChildType.split('_')[1]==pos[i].pos;
				})[0];
				temp.clear();
				this.doPaint(temp,pos[i].pos,rect);
				temp.x=pos[i].x;
				temp.y=pos[i].y;
			}
			return {
				width:rect.width,
				height:rect.height,
				left:rect.left+nodePos.x+nodePos.center.x,
				top:rect.top+nodePos.y+nodePos.center.y,
				right:rect.right+nodePos.x+nodePos.center.x,
				bottom:rect.bottom+nodePos.y+nodePos.center.y
			};
		},
		//执行绘制
		doPaint:function(node,pos,rect){
			var l1=this.data.l,
				l2=this.data.l*1.5;
			node.beginFill(0xff0000);
			node.lineStyle(2,0x000000);
			//node.drawCircle(0,0,10);
			node.moveTo(0,0);
			if(pos=='topLeft'||pos=='top'){
				node.lineTo(rect.width/2,0);
			}
			if(pos=='topRight'||pos=='right'){
				node.lineTo(0,rect.height/2);
			}
			if(pos=='bottomRight'||pos=='bottom'){
				node.lineTo(-rect.width/2,0);
			}
			if(pos=='bottomLeft'||pos=='left'){
				node.lineTo(0,-rect.height/2);
			}
			if(pos=='topLeft'){
				node.moveTo(0,0);
				node.lineTo(-l1,l1);
				node.lineTo(-l1,-l1);
				node.lineTo(l1,-l1);
				node.lineTo(-l1,l1);
			}
			if(pos=='topRight'){
				node.moveTo(0,0);
				node.lineTo(-l1,-l1);
				node.lineTo(l1,-l1);
				node.lineTo(l1,l1);
				node.lineTo(-l1,-l1);
			}
			if(pos=='bottomRight'){
				node.moveTo(0,0);
				node.lineTo(l1,-l1);
				node.lineTo(l1,l1);
				node.lineTo(-l1,l1);
				node.lineTo(l1,-l1);
			}
			if(pos=='bottomLeft'){
				node.moveTo(0,0);
				node.lineTo(l1,l1);
				node.lineTo(-l1,l1);
				node.lineTo(-l1,-l1);
				node.lineTo(l1,l1);
			}
			if(pos=='top'){
				node.moveTo(0,0);
				node.lineTo(-l2,0);
				node.lineTo(0,-l2);
				node.lineTo(l2,0);
			}
			if(pos=='right'){
				node.moveTo(0,0);
				node.lineTo(0,-l2);
				node.lineTo(l2,0);
				node.lineTo(0,l2);
			}
			if(pos=='bottom'){
				node.moveTo(0,0);
				node.lineTo(l2,0);
				node.lineTo(0,l2);
				node.lineTo(-l2,0);
			}
			if(pos=='left'){
				node.moveTo(0,0);
				node.lineTo(0,l2);
				node.lineTo(-l2,0);
				node.lineTo(0,-l2);
			}
			node.endFill();
		},
		removePoint:function(node){
			var childs=node.children;
			for(var i=childs.length-1;i>-1;i--){
				if(childs[i].areaChildType.indexOf('scalePoint')!=-1){
					node.removeChild(childs[i]);
				}
			}
		},
		//缩放点拖动事件
		scalePointEvent:function(pt){
			var that=this;
			pt.interactive=true;
			//拖拽
			pt.on('mousedown',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (!this.dragging) {//只有缩放区域时可以自由拖动
					dragStart(e,this);
				}
			});
			pt.on('mousemove',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				if (this.dragging) {//只有缩放区域时可以自由拖动
					edObj.doing='polygonScalePointMove';
					dragMove(e,this,function(node){
						var ptType=node.areaChildType.split('_')[1],
							x=node.x,
							y=node.y;
						that.resizeRect(node,ptType,x,y);
					});
				}
			});
			pt.on('mouseup',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (this.dragging) {//只有缩放区域时可以自由拖动
					edObj.doing=null;
					dragEnd(e,this,function(node){
						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(node.parent.mapData);

						var ptType=node.areaChildType.split('_')[1],
							x=node.x,
							y=node.y;
						var newRect=that.resizeRect(node,ptType,x,y);
						var points=JSON.parse(JSON.stringify(node.parent.mapData.posData.points));
						var oldRect=mapMath.getRectFromPointsArys([points]);
						var scale={
							x:newRect.width/oldRect.width,
							y:newRect.height/oldRect.height
						}
						points.forEach(function(pt){
							pt.x=newRect.left+(pt.x-oldRect.left)*scale.x,
							pt.y=newRect.top+(pt.y-oldRect.top)*scale.y
						});
						mapPolygon.repaintRect(node.parent,points);
						mapPolygon.updateOldData(node.parent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(node.parent.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',node.parent)
						}];
						var local=[ltemp];
						mapHistory.appendHistory({
							name:'缩放',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',node.parent)
						//});
					});
				}
			});
			pt.on('mouseupoutside',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (this.dragging) {//只有缩放区域时可以自由拖动
					edObj.doing=null;
					dragEnd(e,this,function(node){
						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(node.parent.mapData);

						var ptType=node.areaChildType.split('_')[1],
							x=node.x,
							y=node.y;
						var newRect=that.resizeRect(node,ptType,x,y);
						var points=JSON.parse(JSON.stringify(node.parent.mapData.posData.points));
						var oldRect=mapMath.getRectFromPointsArys([points]);
						var scale={
							x:newRect.width/oldRect.width,
							y:newRect.height/oldRect.height
						}
						points.forEach(function(pt){
							pt.x=newRect.left+(pt.x-oldRect.left)*scale.x,
							pt.y=newRect.top+(pt.y-oldRect.top)*scale.y
						});
						mapPolygon.repaintRect(node.parent,points);
						mapPolygon.updateOldData(node.parent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(node.parent.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',node.parent)
						}];
						var local=[ltemp];
						mapHistory.appendHistory({
							name:'缩放',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',node.parent)
						//});
					});
				}
			});
		},
		show:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('scalePoint')!=-1){
						childs[i].visible=true;
					}
				}
			}
		},
		hide:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('scalePoint')!=-1){
						childs[i].visible=false;
					}
				}
			}
		}
	},
	//合并区域
	merge:{
		data:{
			del:[],
			add:[],
			server:[],
			local:[]
		},
		//执行合并
		doMerge:function(){
			if(edObj.curNode.length<2){//当前选中只有1个区域时结束
				return;
			}
			var mNodes=this.getMergeNodes();//获取可合并的两个区域
			if(mNodes){//有可合并区域
				this.data.del.push(mNodes.sNode);
				this.data.del.push(mNodes.eNode);
				var nodeData=this.mergeNodes(mNodes.sNode,mNodes.eNode);//合并两个区域
				var newNode=nodeData.node;
				this.data.server=this.data.server.concat(nodeData.server);
				this.data.add.push(newNode);
				if(edObj.curNode.length>1){
					this.doMerge();//继续合并
				}else{
					var sData=this.serverPost();
					var server=this.data.server.concat(sData.server);
					var local=sData.local;
					mapHistory.appendHistory({
						name:'合并',
						server:server,
						local:local
					});
					this.clear();
				}
			}else{//选中区域超过1个 但没有可合并区域时
				//取消选择第一位选中
				var oldIsCtrl=edObj.keyStatus.isCtrl;
				if(!oldIsCtrl){
					edObj.keyStatus.isCtrl=true;
				}
				mapPolygon.selectNode(edObj.curNode[0]);
				edObj.keyStatus.isCtrl=oldIsCtrl;
				if(edObj.curNode.length>1){
					this.doMerge();//继续合并
				}else{
					var sData=this.serverPost();
					var server=this.data.server.concat(sData.server);
					var local=sData.local;
					mapHistory.appendHistory({
						name:'合并',
						server:server,
						local:local
					});
					this.clear();
				}
			}
		},
		serverPost:function(){
			var data=this.data,
				dels=data.del,
				adds=data.add;
			for(var i=dels.length-1;i>-1;i--){
				for(var j=adds.length-1;j>-1;j--){
					if(dels[i]==adds[j]){
						dels.splice(i,1);
						adds.splice(j,1);
						break;
					}
				}
			}
			var server=[],
				local=[];
			for(var i=adds.length-1;i>-1;i--){
				server.push({
					type:'addArea',
					data:mapServerData.getDataFromNode('addArea',adds[i])
				});
				local.push({
					type:'add',
					data:JSON.stringify(adds[i].mapData),
				})
			}
			for(var i=dels.length-1;i>-1;i--){
				server.push({
					type:'delArea',
					data:mapServerData.getDataFromNode('delArea',dels[i])
				});
				local.push({
					type:'delete',
					data:JSON.stringify(dels[i].mapData),
				})
			}
			/*for(var i=adds.length-1;i>-1;i--){
				(function(i){
					mapServerData.changeServer({//上传服务器数据
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',adds[i])
					});
				})(i)
			}
			for(var i=dels.length-1;i>-1;i--){
				(function(i){
					mapServerData.changeServer({//上传服务器数据
						type:'delArea',
						data:mapServerData.getDataFromNode('delArea',dels[i])
					});
				})(i)
			}*/
			return {
				server:server,
				local:local
			};
		},
		//合并两个区域
		mergeNodes:function(sNode,eNode){
			var sPoints=sNode.mapData.posData.points;
			var ePoints=eNode.mapData.posData.points;
			//把多个合并点的改为两个合并点
			for(var i=0;i<sPoints.length;i++){
				if(sPoints[i].merge){
					var prev=i-1;
					if(prev==-1){
						prev=sPoints.length-1;
					}
					var next=i+1;
					if(next==sPoints.length){
						next=0;
					}
					if(sPoints[prev].merge&&sPoints[next].merge){
						sPoints[i].del=true;
					}
				}
			}
			sPoints=sPoints.filter(function(item){
				return !item.del;
			});
			for(var i=0;i<ePoints.length;i++){
				if(ePoints[i].merge){
					var prev=i-1;
					if(prev==-1){
						prev=ePoints.length-1;
					}
					var next=i+1;
					if(next==ePoints.length){
						next=0;
					}
					if(ePoints[prev].merge&&ePoints[next].merge){
						ePoints[i].del=true;
					}
				}
			}
			ePoints=ePoints.filter(function(item){
				return !item.del;
			});
			//把多个合并点的改为两个合并点 end
			//合并点为相邻两点则转换成首尾两点
			var sMpt=sPoints.filter(function(item,index){
				item.index=index;
				return item.merge
			});
			if(Math.abs(sMpt[0].index-sMpt[1].index)==1){
				var a=sPoints.splice(sMpt[1].index,sPoints.length-sMpt[1].index);
				sPoints=a.concat(sPoints);
			}
			var eMpt=ePoints.filter(function(item,index){
				item.index=index;
				return item.merge
			});
			if(Math.abs(eMpt[0].index-eMpt[1].index)==1){//合并点为相邻两点则转换成首尾两点
				var a=ePoints.splice(eMpt[1].index,ePoints.length-eMpt[1].index);
				ePoints=a.concat(ePoints);
			}
			//合并点为相邻两点则转换成首尾两点 end
			//去掉合并点
			for(var i=sPoints.length-1;i>-1;i--){
				if(sPoints[i].merge){
					sPoints.splice(i,1);
				}
			}
			for(var i=ePoints.length-1;i>-1;i--){
				if(ePoints[i].merge){
					ePoints.splice(i,1);
				}
			}
			//去掉合并点 end
			//数组合并
			var newPoints=sPoints.concat(ePoints);
			//清理多余属性
			this.clearPointsData(newPoints);
			//添加新区域
			var oldIsCtrl=edObj.keyStatus.isCtrl;
			if(!oldIsCtrl){
				edObj.keyStatus.isCtrl=true;
			}
			var newArea=mapPolygon.append({
				points:newPoints,
				color:sNode.mapData.color,
			});
			mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(sNode));
			mapPolygon.selectNode(newArea,true);
			//清理旧区域
			var server=[],local=[];
			var sData=mapPolygon.clearPathPtLink(sNode);
			var eData=mapPolygon.clearPathPtLink(eNode);
			server=server.concat(sData.server).concat(eData.server);
			local=local.concat(sData.local).concat(eData.local);
			edObj.mapBg.removeChild(sNode);
			edObj.mapBg.removeChild(eNode);
			edObj.curNode.splice(edObj.curNode.indexOf(sNode),1);
			edObj.curNode.splice(edObj.curNode.indexOf(eNode),1);
			mapDetails.showSelPolygon();//多边形详情
			edObj.keyStatus.isCtrl=oldIsCtrl;
			
			return {
				node:newArea,
				server:server,
				local:local
			};
		},
		clearPointsData:function(points){
			for(var i=0;i<points.length;i++){
				points[i]={
					x:points[i].x,
					y:points[i].y
				}
			}
		},
		//获取可合并的两个区域
		getMergeNodes:function(){
			if(edObj.curNode.length<2){
				return null;
			}
			var sNode=edObj.curNode[0];
			var sPoints=sNode.mapData.posData.points;
			var eNode=null;
			var isSame=false;
			for(var i=1;i<edObj.curNode.length;i++){
				var ePoints=edObj.curNode[i].mapData.posData.points;
				var idx=1;
				var sameNum=0;
				for(var j=0;j<sPoints.length;j++){
					var sp=sPoints[j];
					for(var k=0;k<ePoints.length;k++){
						var ep=ePoints[k];
						var dx=Math.abs(sp.x-ep.x);
						var dy=Math.abs(sp.y-ep.y);
						if(dx<2&&dy<2){
							isSame=true;
							sp.merge=idx;
							ep.merge=idx;
							sameNum++;
							idx++;
						}
					}
				}
				if(isSame){
					if(sameNum>1){//至少得有两个相同点
						eNode=edObj.curNode[i];
						break;
					}else{
						this.clearPointsData(sPoints);
						this.clearPointsData(ePoints);
					}
				}else{
					this.clearPointsData(sPoints);
					this.clearPointsData(ePoints);
				}
			}
			if(eNode){
				return {
					sNode:sNode,
					eNode:eNode
				}
			}else{
				return null;
			}
		},
		//清空
		clear:function(){
			if(!this.data){
				return;
			}
			this.data.del=[];
			this.data.add=[];
			this.data.server=[];
			this.data.local=[];
		}
	},
	//分割区域
	clip:{
		data:null,
		//执行分割
		doClip:function(){
			var server=[],local=[];
			var corssData=this.getCrossPoints();
			if(corssData===false){
				//console.log('没有线数据了，结束');
				this.clear();
				return;
			}
			if(corssData.length<1){
				//console.log('没有交点继续下一条线',this.data.length);
				edObj.mapBg.removeChild(this.data[0].node);
				this.data[0]=null;
				this.data.splice(0,1);
				this.doClip();
				return;
			}
			
			//return;
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
				var oldIsCtrl=edObj.keyStatus.isCtrl;
				if(!oldIsCtrl){
					edObj.keyStatus.isCtrl=true;//为了多选...
				}
				for(var i=0;i<clipArys.length;i++){
					var newNode=mapPolygon.append({
						points:clipArys[i],
						color:node.mapData.color,
					});
					this.data.allArea.push(newNode);
					mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(node));
					mapPolygon.selectNode(newNode,true);
				}
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
					alls=data.allArea,
					dels=data.delArea;
				for(var i=alls.length-1;i>-1;i--){
					for(var j=dels.length-1;j>-1;j--){
						if(alls[i]==dels[j]){
							alls.splice(i,1);
							dels.splice(j,1);
							break;
						}
					}
				}
				//清理过程中生成后又被再次分割的数据 end
				/*for(var i=alls.length-1;i>-1;i--){
					(function(i){
						mapServerData.changeServer({//上传服务器数据
							type:'addArea',
							data:mapServerData.getDataFromNode('addArea',alls[i])
						});
					})(i)
				}
				for(var i=dels.length-1;i>-1;i--){
					(function(i){
						mapServerData.changeServer({//上传服务器数据
							type:'delArea',
							data:mapServerData.getDataFromNode('delArea',dels[i])
						});
					})(i)
				}*/
				for(var i=alls.length-1;i>-1;i--){
					server.push({//上传服务器数据
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',alls[i])
					});
					local.push({
						type:'add',
						data:JSON.stringify(alls[i].mapData),
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
			//this.target.node=edObj.curNode[0];
			//this.target.index=edObj.mapBg.children.indexOf(edObj.curNode[0]);
			//this.target.color=edObj.curNode[0].mapData.color;
			//this.target.points=JSON.parse(JSON.stringify(edObj.curNode[0].mapData.posData.points));
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
		//通过输入框指定坐标添加点
		addPointFromInput:function(){
			var xbox=$('#printClipLine_x');
			var ybox=$('#printClipLine_y');
			var x=parseFloat(xbox.val());
			var y=parseFloat(ybox.val());
			if(x!=x||y!=y){
				return;
			}
			this.printPoint({
				x:x,
				y:y
			});
			xbox.val('');
			ybox.val('');
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
			/*if(this.data.length>1){
				this.doClip();
			}*/
		},
		//清空
		clear:function(){
			if(!this.data){
				return;
			}
			this.data.delArea=null;
			this.data.newArea=null;
			for(var i=0;i<this.data.length;i++){
				edObj.mapBg.removeChild(this.data[i].node);
				this.data[i]=null;
			}
			this.data=null;
		}
	},
	/*添加logo
	* obj:url|posType|align|x|y|scale
	*/
	addLogo:function(node,obj){
		var logo=null;
		for(var i=0;i<node.children.length;i++){
			if(node.children[i].areaChildType=='logo'){
				logo=node.children[i];
				break;
			}
		}
		var posX,
			posY,
			cx=node.mapData.posData.center.x,
			cy=node.mapData.posData.center.y;
		obj.scale=obj.scale?obj.scale:1;
		posX=Math.round(obj.x);
		posY=Math.round(obj.y);
		posX=posX||0;
		posY=posY||0;
		posX=posX-cx;
		posY=posY-cy;
		if(!logo){
			logo = PIXI.Sprite.fromImage(obj.url);
			logo.areaChildType='logo';
			logo.x = posX;
			logo.y = posY;
			logo.scale.x=parseFloat(obj.scale)?parseFloat(obj.scale):1;
			logo.scale.y=parseFloat(obj.scale)?parseFloat(obj.scale):1;
			node.addChild(logo);
		}else{
			logo.texture=new PIXI.Texture.fromImage(obj.url);
			logo.x = posX;
			logo.y = posY;
			logo.scale.x=parseFloat(obj.scale)?parseFloat(obj.scale):1;
			logo.scale.y=parseFloat(obj.scale)?parseFloat(obj.scale):1;
		}
		node.mapData.logo=obj;
	},
	//添加标签
	addText:function(node,obj){
		var txtNode=null;
		for(var i=0;i<node.children.length;i++){
			if(node.children[i].areaChildType=='label'){
				txtNode=node.children[i];
				break;
			}
		}
		var textObj={
			txt:obj.Name,
			fontSize:Math.round(obj.FontSize),
			textColor:obj.TextColor.replace('0x','#'),
			x:Math.round(obj.TextX),
			y:Math.round(obj.TextY),
			w:Math.round(obj.TextW),
			h:Math.round(obj.TextH),
			angel:parseFloat(obj.TextRotate)/57.29577951308233,
			showText:obj.TextMapping
		}
		var nodePos=node.mapData.posData;
		obj.TextColor=obj.TextColor.replace('0x','#');
		if(!txtNode){
			var fontStyle=new PIXI.TextStyle({
				fontSize: textObj.fontSize?textObj.fontSize:16,
				fill:textObj.textColor?textObj.textColor:'#000000',
				fontWeight:'normal',
				fontStyle:'normal',
			});
			txtNode = new PIXI.Text(textObj.txt,fontStyle);
			txtNode.anchor.set(0.5);
			txtNode.x=textObj.x?textObj.x:0;
			txtNode.y=textObj.y?textObj.y:0;
			txtNode.rotation=textObj.angel;
			txtNode.visible=textObj.showText;
			txtNode.areaChildType='label';
			node.addChild(txtNode);
			node.mapData.oldData.area.TextW=txtNode.width;
			node.mapData.oldData.area.TextH=txtNode.height;
		}else{
			txtNode.text=textObj.txt;
			var fontStyle=new PIXI.TextStyle({
				fontSize:textObj.fontSize?textObj.fontSize:16,
				fill:textObj.textColor?textObj.textColor:'#000000',
				fontWeight:'normal',
				fontStyle:'normal',
			});
			txtNode.style=fontStyle;
			var ofW=txtNode.width/2,
				ofH=txtNode.height/2;
			txtNode.x=textObj.x?textObj.x:0;
			txtNode.y=textObj.y?textObj.y:0;
			txtNode.rotation=textObj.angel;
			txtNode.visible=textObj.showText;
			node.mapData.oldData.area.TextW=txtNode.width;
			node.mapData.oldData.area.TextH=txtNode.height;
		}
	},
	//复制选中多边形 isCut true剪切 false复制
	copy:function(isCut){
		if(edObj.curNode.length<1){
			return;
		}
		
		edObj.copyData.datas=[];
		for(var i=0;i<edObj.curNode.length;i++){
			var index=edObj.mapBg.children.indexOf(edObj.curNode[i]);
			if(index!=-1){
				edObj.copyData.datas.push({
					mapData:JSON.stringify(edObj.curNode[i].mapData),
					index:index
				});
			}
		}
		edObj.copyData.datas.sort(function(a,b){
			return a.index-b.index;
		});
		if(isCut){
			var server=[],local=[];
			for(var i=edObj.copyData.datas.length-1;i>-1;i--){
				server.push({
					type:'delArea',
					data:mapServerData.getDataFromNode('delArea',edObj.mapBg.children[edObj.copyData.datas[i].index])
				})
				/*(function(i){
					mapServerData.changeServer({//上传服务器数据
						type:'delArea',
						data:mapServerData.getDataFromNode('delArea',edObj.mapBg.children[edObj.copyData.datas[i].index])
					});
				})(i)*/
			}
			edObj.copyData.action='cut';
			for(var i=edObj.copyData.datas.length-1;i>-1;i--){
				var ltemp={
					type:'delete',
					data:JSON.stringify(edObj.mapBg.children[edObj.copyData.datas[i].index].mapData)
				};
				local.push(ltemp);
				edObj.mapBg.removeChildAt(edObj.copyData.datas[i].index);
			}
			mapHistory.appendHistory({
				name:'剪切',
				server:server,
				local:local
			})
			edObj.curNode=[];
		}else{
			edObj.copyData.action='copy';
		}
		showToast({
			title:'复制成功'
		});
	},
	//粘贴选中多边形
	paste:function(mouseData){
		if(JSON.stringify(edObj.copyData)==='{}'){
			return;
		}
		
		if(!mouseData){//键盘粘贴
			//copyToCenter复制到屏幕中心 copyToEle复制到原来元素旁边
			//var copyMode=$('input[name="copyMode"]:checked').val();
			//if(copyMode=='copyToCenter'){//复制到屏幕中心
				var data=[];
				for(var i=0;i<edObj.copyData.datas.length;i++){
					var mapData=JSON.parse(edObj.copyData.datas[i].mapData);
					data.push({
						color:mapData.color,
						points:mapData.posData.points
					});
				}
	
				var pointArys=[];
				data.forEach(function(item){
					pointArys.push(item.points);
				});
				var rect=mapMath.getRectFromPointsArys(pointArys);
				
				var center=mapMath.getMapPointInAppPos({
					x:edObj.app.screen.width/2,
					y:edObj.app.screen.height/2
				});
				var L=center.x-rect.width/2;
				var T=center.y-rect.height/2;
				var difX=rect.left-L;
				var difY=rect.top-T;
				var nodes=[];
				data.forEach(function(item){
					item.points.forEach(function(point){
						point.x-=difX;
						point.y-=difY;
					});
					var nd=mapPolygon.append({
						points:item.points,
						color:item.color,
					});
					nodes.push(nd);
				});
				var server=[],local=[];
				for(var i=nodes.length-1;i>-1;i--){
					server.push({
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',nodes[i])
					});
					local.push({
						type:'add',
						data:JSON.stringify(nodes[i].mapData)
					});
				}
				mapHistory.appendHistory({
					name:'粘贴',
					server:server,
					local:local
				});
				/*for(var i=nodes.length-1;i>-1;i--){
					(function(i){
						mapServerData.changeServer({//上传服务器数据
							type:'addArea',
							data:mapServerData.getDataFromNode('addArea',nodes[i])
						});
					})(i)
				}*/
			/*}
			if(copyMode=='copyToEle'){//复制到原来元素旁边
				if(edObj.copyData.action=='copy'){
					for(var i=edObj.copyData.datas.length-1;i>-1;i--){
						var mapData=JSON.parse(edObj.copyData.datas[i].mapData);
						var newNode=mapPolygon.append(mapData.posData.points,mapData.color);
						//edObj.mapBg.removeChildAt(edObj.copyData.datas[i].index);
						var index=edObj.copyData.datas[i].index+1;
						newNode.x+=20;
						newNode.y+=20;
						this.updatePolygonPos('move',newNode);
						mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,index);
					}
					mapHistory.appendHistory('粘贴');
				}
				if(edObj.copyData.action=='cut'){
					for(var i=0;i<edObj.copyData.datas.length;i++){
						var mapData=JSON.parse(edObj.copyData.datas[i].mapData);
						var newNode=mapPolygon.append(mapData.posData.points,mapData.color);
						//edObj.mapBg.removeChildAt(edObj.copyData.datas[i].index);
						var index=edObj.copyData.datas[i].index;
						this.updatePolygonPos('move',newNode);
						mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,index);
					}
					mapHistory.appendHistory('粘贴');
				}
				
			}*/
		}else{//根据鼠标位置粘贴
			var data=[];
			for(var i=0;i<edObj.copyData.datas.length;i++){
				var mapData=JSON.parse(edObj.copyData.datas[i].mapData);
				data.push({
					color:mapData.color,
					points:mapData.posData.points
				});
			}
			
			var rect={
				l:9999,
				t:9999,
				r:0,
				b:0
			};
			var pos=mapMath.getMapPointInAppPos(mouseData);
			data.forEach(function(item){
				item.points.forEach(function(point){
					if(point.x<rect.l){
						rect.l=point.x;
					}
					if(point.y<rect.t){
						rect.t=point.y;
					}
					if(point.x>rect.r){
						rect.r=point.x;
					}
					if(point.y>rect.b){
						rect.b=point.y;
					}
				})
			});
			rect.w=rect.r-rect.l;
			rect.h=rect.b-rect.t;
			var L=pos.x-rect.w/2;
			var T=pos.y-rect.h/2;
			var difX=rect.l-L;
			var difY=rect.t-T;
			var nodes=[];
			data.forEach(function(item){
				item.points.forEach(function(point){
					point.x-=difX;
					point.y-=difY;
				});
				var nd=mapPolygon.append({
					points:item.points,
					color:item.color,
				});
				nodes.push(nd);
			});
			var server=[],local=[];
			for(var i=nodes.length-1;i>-1;i--){
				server.push({
					type:'addArea',
					data:mapServerData.getDataFromNode('addArea',nodes[i])
				});
				local.push({
					type:'add',
					data:JSON.stringify(nodes[i].mapData)
				});
			}
			mapHistory.appendHistory({
				name:'粘贴',
				server:server,
				local:local
			});
			/*for(var i=nodes.length-1;i>-1;i--){
				(function(i){
					mapServerData.changeServer({//上传服务器数据
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',nodes[i])
					});
				})(i)
			}*/
		}
	},
	//删除
	delete:function(){
		if(edObj.curNode.length<1){
			return {
				server:[],
				local:[]
			};
		}
		var server=[],local=[];
		for(var i=edObj.curNode.length-1;i>-1;i--){
			server.push({
				type:'delArea',
				data:mapServerData.getDataFromNode('delArea',edObj.curNode[i])
			});
			local.push({
				type:'delete',
				data:JSON.stringify(edObj.curNode[i].mapData)
			});
			/*(function(i){
				mapServerData.changeServer({//上传服务器数据
					type:'delArea',
					data:mapServerData.getDataFromNode('delArea',edObj.curNode[i])
				});
			})(i)*/
		}
		var childs=edObj.mapBg.children;
		for(var i=edObj.curNode.length-1;i>-1;i--){
			var idx=childs.indexOf(edObj.curNode[i]);
			var pData=mapPolygon.clearPathPtLink(edObj.curNode[i]);
			server=server.concat(pData.server);
			local=local.concat(pData.local);
			childs.splice(idx,1);
			edObj.curNode.splice(i,1);
		}
		return {
			server:server,
			local:local
		};
	},
	//对多选的多边形进行整体旋转
	rotNodes:{
		paintRotRect:function(){
			if(edObj.curNode.length<1){
				return;
			}
			var rotNode=edObj.mapBg.children.filter(function(item){
				return item.areaChildType=='rotNodes';
			})[0];
			var arys=[];
			for(var i=0;i<edObj.curNode.length;i++){
				arys.push(edObj.curNode[i].mapData.posData.points);
			}
			var rc=mapMath.getRectFromPointsArys(arys);
			var rotCenter={
				x:rc.left+rc.width/2,
				y:rc.top+rc.height/2
			};
			if(rotNode){
				rotNode.clear();
				rotNode.beginFill('0x000000',0);
				
				rotNode.lineStyle (2,'0xff0000');
				rotNode.moveTo(-rc.width/2,-rc.height/2);
				rotNode.lineTo(rc.width/2,-rc.height/2);
				rotNode.lineTo(rc.width/2,rc.height/2);
				rotNode.lineTo(-rc.width/2,rc.height/2);
				rotNode.lineTo(-rc.width/2,-rc.height/2);
				
				rotNode.lineStyle (16,'0xff0000');
				rotNode.arc(0,0,16);
				rotNode.drawCircle(0,0,16);
				
				rotNode.endFill();
				
				rotNode.x=rotCenter.x-edObj.width/2;
				rotNode.y=rotCenter.y-edObj.width/2;
				rotNode.rotation=0;
			}else{
				rotNode=new PIXI.Graphics();
				rotNode.beginFill('0x000000',0);
				
				rotNode.lineStyle (2,'0xff0000');
				rotNode.moveTo(-rc.width/2,-rc.height/2);
				rotNode.lineTo(rc.width/2,-rc.height/2);
				rotNode.lineTo(rc.width/2,rc.height/2);
				rotNode.lineTo(-rc.width/2,rc.height/2);
				rotNode.lineTo(-rc.width/2,-rc.height/2);
				
				rotNode.lineStyle (16,'0xff0000');
				rotNode.arc(0,0,16);
				rotNode.drawCircle(0,0,16);
				
				rotNode.endFill();
				
				rotNode.x=rotCenter.x-edObj.width/2;
				rotNode.y=rotCenter.y-edObj.width/2;
				rotNode.rotation=0;
				rotNode.areaChildType='rotNodes';
				
				edObj.mapBg.addChild(rotNode);
			}
		},
		show:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('rotNodes')!=-1){
						childs[i].visible=true;
					}
				}
			}
		},
		hide:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('rotNodes')!=-1){
						childs[i].visible=false;
					}
				}
			}
		},
		remove:function(){
			var rotNode=edObj.mapBg.children.filter(function(item){
				return item.areaChildType=='rotNodes';
			});
			for(var i=0;i<rotNode.length;i++){
				edObj.mapBg.removeChild(rotNode[i]);
			}
		},
		doRot:function(nodes,angel){
			var arys=[];
			for(var i=0;i<nodes.length;i++){
				arys.push(nodes[i].mapData.posData.points);
			}
			var rc=mapMath.getRectFromPointsArys(arys);
			var rotCenter={
				x:rc.left+rc.width/2,
				y:rc.top+rc.height/2
			};
			for(var i=nodes.length-1;i>-1;i--){
				var points=nodes[i].mapData.posData.points.map(function(item){
					return {
						x:item.x,
						y:item.y
					};
				});
				var newPoints=[];
				for(var j=0;j<points.length;j++){
					newPoints.push(mapMath.pointArcMove(points[j],rotCenter,angel));
				}
				mapPolygon.repaintRect(nodes[i],newPoints);
			}
			this.paintRotRect();
			mapDetails.showSelPolygon();//多边形详情
		}
	},
	//旋转多边形
	areaRot:{
		data:{
			r:20,
			al:5,
			top:50,
			tempLine:null,
		},
		//添加旋转点
		addPoint:function(node){
			var rc=mapMath.getRectFromPointsArys([node.mapData.posData.points]),
				r=this.data.r,
				l=this.data.al;
			var temp=new PIXI.Graphics();
			temp.beginFill(0xffffff,0.3);
			temp.lineStyle(4,0x0000ff);
			
			
			temp.arc(0,0,r,0.25*Math.PI,1.75*Math.PI);
			var sp={
				x:0+r*Math.cos(1.75*Math.PI),
				y:0+r*Math.sin(1.75*Math.PI)
			}
			temp.moveTo(sp.x,sp.y);
			temp.lineTo(sp.x-l,sp.y+l);
			temp.lineTo(sp.x+l,sp.y+l);
			temp.lineTo(sp.x+l,sp.y-l);
			temp.lineTo(sp.x,sp.y);
			temp.endFill();
			temp.x=0;
			temp.y=-rc.height/2-this.data.top;
			temp.areaChildType='rotPoint';
			if(edObj.operStatus!='oper_click'){
				temp.visible=false;
			}
			node.addChild(temp);
			this.bindEvent(temp);
		},
		removePoint:function(node){
			var childs=node.children;
			for(var i=childs.length-1;i>-1;i--){
				if(childs[i].areaChildType.indexOf('rotPoint')!=-1){
					node.removeChild(childs[i]);
				}
			}
		},
		show:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('rotPoint')!=-1){
						childs[i].visible=true;
					}
				}
			}
		},
		hide:function(){
			if(edObj.curNode.length<1){
				return;
			}
			for(var j=0;j<edObj.curNode.length;j++){
				var childs=edObj.curNode[j].children;
				for(var i=childs.length-1;i>-1;i--){
					if(childs[i].areaChildType.indexOf('rotPoint')!=-1){
						childs[i].visible=false;
					}
				}
			}
		},
		//旋转点事件
		bindEvent:function(node){
			var that=this;
			node.interactive=true;
			//拖拽
		    node.on('mousedown',function(e){
		    	if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
		    	e.stopPropagation();
		    	if (!this.dragging) {
		    		dragStart(e,this);
			    }
			});
			node.on('mousemove',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				if (this.dragging) {
					edObj.doing='polygonRotPointMove';
		    		dragMove(e,this,function(node){
		    			that.paintTempLine(node);
		    		});
			   }
			});
			node.on('mouseup',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (this.dragging) {
					edObj.doing=null;
		    		dragEnd(e,this,function(node){
		    			var angel=that.paintTempLine(node);
		    			that.removeTempLine(node);
						var nodeParent=node.parent;

						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(nodeParent.mapData);

						nodeParent.rotation=angel;
						mapPolygon.updatePolygonPos('rot',nodeParent);
						mapPolygon.updateOldData(nodeParent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(nodeParent.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',nodeParent)
						}];
						var local=[ltemp];
		    			mapHistory.appendHistory({
							name:'旋转',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',nodeParent)
						//});
		    		});
			   }
			});
			node.on('mouseupoutside',function(e){
				if(this.parent.mapData.locked==true){//锁定判定
					return;
				}
				e.stopPropagation();
				if (this.dragging) {
					edObj.doing=null;
		    		dragEnd(e,this,function(node){
		    			var angel=that.paintTempLine(node);
		    			that.removeTempLine(node);
						var nodeParent=node.parent;

						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(nodeParent.mapData);

						nodeParent.rotation=angel;
						mapPolygon.updatePolygonPos('rot',nodeParent);
						mapPolygon.updateOldData(nodeParent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.to=JSON.stringify(nodeParent.mapData);
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',nodeParent)
						}];
						var local=[ltemp];
		    			mapHistory.appendHistory({
							name:'旋转',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',nodeParent)
						//});
		    		});
			   }
			});
		},
		paintTempLine:function(node){
			var temp;
			if(!this.data.tempLine){
				temp=new PIXI.Graphics();
			}else{
				temp=this.data.tempLine;
				temp.clear();
			}
			var pos=JSON.parse(JSON.stringify(node.parent.mapData.posData));
			var points=pos.points.map(function(item){
				return {
					x:item.x-pos.x-pos.center.x,
					y:item.y-pos.y-pos.center.y
				}
			});
			var angel=mapMath.getLineAngel({x:0,y:0},{x:node.x,y:node.y});
			points=points.map(function(item){
				return mapMath.pointArcMove(item,{x:0,y:0},angel);
			});
			temp.beginFill(0xffffff);
			temp.lineStyle(2,0xff0000);
			temp.moveTo(0,0);
			temp.x=0;
			temp.y=0;
			temp.lineTo(-node.x,-node.y);
			temp.moveTo(-node.x+points[0].x,-node.y+points[0].y);
			for(var i=1;i<points.length;i++){
				temp.lineTo(-node.x+points[i].x,-node.y+points[i].y);
			}
			temp.lineTo(-node.x+points[0].x,-node.y+points[0].y);
			temp.endFill();
			
			if(!this.data.tempLine){
				temp.areaChildType='rotPoint';
				node.addChild(temp);
				this.data.tempLine=temp;
			}
			return angel;
		},
		removeTempLine:function(node){
			if(this.data.tempLine){
				node.removeChild(this.data.tempLine);
				this.data.tempLine=null;
			}
		},
		repos:function(node){
			var rc=mapMath.getRectFromPointsArys([node.mapData.posData.points]);
			var rotPt=node.children.filter(function(item){
				return item.areaChildType=='rotPoint';
			})[0];
			rotPt.x=0;
			rotPt.y=-rc.height/2-this.data.top;
		},
	},
	//执行锁定
	lock:function(bLock){
		if(edObj.curNode.length<1){
			return;
		}
		for(var i=0;i<edObj.curNode.length;i++){
			if(!edObj.curNode[i].mapData.locked&&bLock){
				this.lockNode(edObj.curNode[i],true);
			}else if(edObj.curNode[i].mapData.locked&&!bLock){
				this.lockNode(edObj.curNode[i],false);
			}
		}
	},
	//锁定多边形
	lockNode:function(node,bLock){
		if(bLock){
			if(node.mapData.locked){
				return;
			}
			var temp=new PIXI.Graphics();
			temp.beginFill(0x7f7f7f,0.6);
			temp.lineStyle(6,0x7f7f7f);
			var posData=node.mapData.posData;
			var points=posData.points.map(function(item){
				return {
					x:item.x-posData.x-posData.center.x,
					y:item.y-posData.y-posData.center.y
				};
			});
			temp.moveTo(points[0].x,points[0].y);
			for(var i=1;i<points.length;i++){
				temp.lineTo(points[i].x,points[i].y);
			}
			temp.lineTo(points[0].x,points[0].y);
			temp.endFill();
			
			temp.areaChildType='lockNode';
			
			
			node.addChild(temp);
			node.mapData.locked=true;
		}else{
			if(!node.mapData.locked){
				return;
			}
			var lockNode=node.children.filter(function(item){
				return item.areaChildType=='lockNode';
			})[0];
			node.removeChild(lockNode);
			node.mapData.locked=false;
		}
	},
	updateOldData:function(node){
		var data=node.mapData,
			oldArea=data.oldData.area,
			oldPoint=data.oldData.point;
		oldArea.Area=data.posData.points.map(function(item){
			return Math.round(item.x)+','+Math.round(item.y);
		}).join('|');
		oldArea.CPointID=Math.round(data.posData.x+data.posData.center.x)+','+Math.round(data.posData.y+data.posData.center.y);
		oldArea.PointX=Math.round(data.path.x);
		oldArea.PointY=Math.round(data.path.y);
		
		oldPoint.X=Math.round(data.path.x);
		oldPoint.Y=Math.round(data.path.y);
	},
}
