//绘制路径
var mapPath={
	myStyle:{
		nodeColor:'0xffffff',
		pathWidth:2,
		pathColor:'0xff0000',
		selectColor:'0xFFFFFF',
	},
	selPt:[],//选中点数据
	visible:false,//是否现在路径
	temp:null,//创建点临时数据
	addTemp:null,//添加点临时数据
	//正式添加路径点到地图中 pos位置 links连接数据
	appendPathPoint:function(pos,links,PointID,obj){
		var temp={};
		temp=new PIXI.Graphics();
		temp.beginFill(this.myStyle.nodeColor);
		
		temp.lineStyle(this.myStyle.pathWidth,this.myStyle.pathColor);
		var linkNodes=[];
		if(links&&links.length>0){
			linkNodes=mapMath.getNodeFromIds(links);
		}
		for(var i=0;i<linkNodes.length;i++){
			var pathData=mapMath.getPathPointData(linkNodes[i]);
			temp.moveTo(0,0);
			temp.lineTo(pathData.x-pos.x,pathData.y-pos.y);
		}
		
		temp.lineStyle (2,0x000000);
		temp.arc(0,0,edObj.pointRad*2-2);
		temp.drawCircle(0,0,edObj.pointRad*2);
		//temp.arc(0,0,8);
		//temp.drawCircle(0,0,10);
		
		temp.endFill();
		
		temp.x=pos.x-edObj.width/2;
		temp.y=pos.y-edObj.height/2;
		temp.visible=true;
		temp.mapData={};
		temp.mapData.links=links;
		if(PointID){
			temp.mapData.PointID=PointID;
			temp.mapData.oldData={
				Code:obj.Code,
				FloorID:obj.FloorID,
				Name:obj.Name,
				Project:obj.Project,
				PointID:PointID,
				X:pos.x,
				Y:pos.y
			};
		}else{
			temp.mapData.PointID='POINT-'+mapMath.formatTimespan(edObj.uid)+'-'+parseInt(Math.random()*4000);
			edObj.uid++;
			temp.mapData.oldData={
				Code:null,
				FloorID:mapServerData.data.FloorID,
				Name:"",
				Project:mapServerData.data.pid,
				PointID:temp.mapData.PointID
			};
			temp.mapData.Code=null
			temp.mapData.FloorID=mapServerData.data.FloorID;
			temp.mapData.Name="";
			temp.mapData.Project=mapServerData.data.pid;
		}
		temp.mapData.posData=pos;
		temp.mapData.selected=false;
		temp.mapData.type='path';
		this.pathPointEvent(temp);
		edObj.mapBg.addChild(temp);
		var local=[];
		linkNodes.forEach(function(item){
			var ltemp={};
			ltemp.type="update";
			ltemp.from=JSON.stringify(item.mapData);
			var PointID=temp.mapData.PointID;
			if(item.mapData.type=="polygon"){
				PointID=temp.mapData.path.PointID;
			}
			item.mapData.links.push(PointID);
			ltemp.to=JSON.stringify(item.mapData);
			local.push(ltemp);
		});
		return {
			node:temp,
			local:local
		};
	},
	//通过输入框指定坐标添加点
	addPointFromInput:function(){
		var xbox=$('#printPath_x');
		var ybox=$('#printPath_y');
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
	//创建点
	printPoint:function(pos){
		this.clearTemp();
		this.temp={};
		var mapPos={
			x:pos.x+edObj.width/2,
			y:pos.y+edObj.height/2
		};
		var temp={};
		temp=new PIXI.Graphics();
		temp.beginFill(0xffffff);
		
		temp.lineStyle (2,0xffff00);
		this.temp.links=[];
		if(this.selPt.length>0){
			for(var i=0;i<this.selPt.length;i++){
				var targetX=this.selPt[i].mapData.posData.x,
					targetY=this.selPt[i].mapData.posData.y;
				temp.moveTo(0,0);
				temp.lineTo(targetX-mapPos.x,targetY-mapPos.y);
				this.temp.links.push(this.selPt[i].mapData.PointID);
			}
		}
		
		temp.lineStyle (2,0xff0000);
		temp.arc(0,0,8);
		temp.drawCircle(0,0,10);
		
		temp.endFill();
		
		temp.x=pos.x;
		temp.y=pos.y;
		temp.visible=true;
		temp.mapData={};
		this.temp.pos={
			x:mapPos.x,
			y:mapPos.y
		}
		temp.mapData.type='tempPath';
		temp.interactive=true;
		var that=this;
	    temp.on('rightclick',function(e){
	    	e.stopPropagation();
	    	that.ok();
		});
		edObj.mapBg.addChild(temp);
	},
	//创建点确定
	ok:function(){
		if(!this.temp){
			return;
		}
		if(!mapServerData.data.FloorID){
			showToast({
				title:'请选择楼层'
			});
			return;
		}
		var ptData=this.appendPathPoint(this.temp.pos,this.temp.links);
		var pt=ptData.node;
		var server=[];
		var local=ptData.local;
		server.push({
			type:'addPoint',
			data:mapServerData.getDataFromNode('addPoint',pt)
		});
		local.push({
			type:'add',
			data:JSON.stringify(pt.mapData)
		})

		if(pt.mapData.links.length>0){
			for(var i=0;i<pt.mapData.links.length;i++){
				server.push({
					type:'addPath',
					data:mapServerData.getDataFromNode('addPath',{
						sid:pt.mapData.PointID,
						eid:pt.mapData.links[i]
					},true)
				})
			}
		}
		mapHistory.appendHistory({
			name:'新增路径点',
			server:server,
			local:local
		});
		/*mapHistory.appendHistory({//历史记录
			name:'新增路径点'
		});
		mapServerData.changeServer({//上传服务器数据
			type:'addPoint',
			data:mapServerData.getDataFromNode('addPoint',pt)
		});
		if(pt.mapData.links.length>0){
			for(var i=0;i<pt.mapData.links.length;i++){
				(function(i){
					mapServerData.changeServer({
						type:'addPath',
						data:mapServerData.getDataFromNode('addPath',{
							sid:pt.mapData.PointID,
							eid:pt.mapData.links[i]
						})
					});
				})(i)
			}
		}*/
		this.selectPoint(pt);
		this.clearTemp();
	},
	//创建点清理临时点
	clearTemp:function(){
		var tempPoints=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return item.mapData.type=='tempPath';
			}
			return false;
		});
		if(tempPoints.length<1){
			return;
		}
		tempPoints.forEach(function(item){
			edObj.mapBg.removeChild(item);
		});
		this.temp=null;
	},
	//在已有线上新增点
	printAddPoint:function(pos){
		this.clearAddTemp();
		this.addTemp={};
		var mapPos={
			x:pos.x+edObj.width/2,
			y:pos.y+edObj.height/2
		};
		var lines=this.getLinkLines();//获取所有的连接线
		var dirData={
			d:9999,
			cross:{x:0,y:0}
		};
		for(var i=0;i<lines.length;i++){
			var p2l=mapMath.getDirFromPointToLine(mapPos,lines[i].from,lines[i].to);
			if(p2l.d<dirData.d&&p2l.isInLine){
				dirData=p2l,
				dirData.links=mapMath.getNodeFromIds([lines[i].from.ptId,lines[i].to.ptId])
			}
		}
		if(dirData.d==9999){//没生成符合要求的点
			return;
		}
		console.log('dirData',dirData);
		//绘制临时点
		var temp={};
		temp=new PIXI.Graphics();
		temp.beginFill(0xffffff);
		
		temp.lineStyle(2,0xffff00);
		this.addTemp.links=[];
		if(dirData.links.length>0){
			for(var i=0;i<dirData.links.length;i++){
				var targetData=mapMath.getPathPointData(dirData.links[i]),
					targetX=targetData.x,
					targetY=targetData.y,
					targetId=targetData.PointID;
				temp.moveTo(0,0);
				temp.lineTo(targetX-dirData.cross.x,targetY-dirData.cross.y);
				this.addTemp.links.push(targetId);
			}
		}
		
		temp.lineStyle (2,0xff0000);
		temp.arc(0,0,8);
		temp.drawCircle(0,0,10);
		
		temp.endFill();
		
		temp.x=dirData.cross.x-edObj.width/2;
		temp.y=dirData.cross.y-edObj.height/2;
		temp.visible=true;
		temp.mapData={};
		this.addTemp.pos={
			x:dirData.cross.x,
			y:dirData.cross.y
		}
		temp.mapData.type='tempAddPath';
		
		edObj.mapBg.addChild(temp);
	},
	//获取所有存在的路径线
	getLinkLines:function(){
		var pathPoints=this.getPathAndPolys();
		if(pathPoints.length<2){
			return;
		}
		var ptDatas=[];//连接点的地图数据
		pathPoints.forEach(function(item){
			ptDatas.push(JSON.parse(JSON.stringify(item.mapData)));//深度复制
		})
		var ptObj={};//连接点快捷查找对象
		ptDatas.forEach(function(item){
			var ptId=item.PointID;
			if(item.type=='polygon'){
				ptId=item.path.PointID;
			}
			ptObj[ptId]=item;
		});
		//获取线数据
		var lines=[];
		for(var i=0;i<ptDatas.length;i++){
			var pFrom=ptDatas[i];
			if(pFrom.type=='polygon'){
				pFrom=ptDatas[i];
			}
			var links=pFrom.links;
			if(pFrom.type=='polygon'){
				links=pFrom.path.links;
			}
			for(var k=0;k<links.length;k++){
				var pTo=ptObj[links[k]];
				if(!pTo){
					continue;
				}
				var obj={
					from:{
						ptId:pFrom.type=='polygon'?pFrom.path.PointID:pFrom.PointID,
						x:pFrom.type=='polygon'?pFrom.path.x:pFrom.posData.x,
						y:pFrom.type=='polygon'?pFrom.path.y:pFrom.posData.y,
					},
					to:{
						ptId:pTo.type=='polygon'?pTo.path.PointID:pTo.PointID,
						x:pTo.type=='polygon'?pTo.path.x:pTo.posData.x,
						y:pTo.type=='polygon'?pTo.path.y:pTo.posData.y,
					}
				};
				
				//obj.from.x=pFrom.type=='polygon'?pFrom.path.x:pFrom.posData.x;
				//obj.from.y=pFrom.type=='polygon'?pFrom.path.y:pFrom.posData.y;
				//obj.to.x=pTo.type=='polygon'?pTo.path.x:pTo.posData.x;
				//obj.to.y=pTo.type=='polygon'?pTo.path.y:pTo.posData.y;
				
				lines.push(obj);
				var toLinks=pTo.type=='polygon'?pTo.path.links:pTo.links;
				toLinks.splice(toLinks.indexOf(pFrom.ptId),1);//移除相连点对本点的连接数据
			}
		}

		return lines;
	},
	//确定新增点
	addOk:function(){
		if(!this.addTemp){
			return;
		}
		var links=this.addTemp.links,
			pos=this.addTemp.pos;
		this.appendPathPoint(pos,links);
		
		var oldLinkNodes=mapMath.getNodeFromIds(this.addTemp.links);
		for(var i=0;i<oldLinkNodes.length;i++){
			var oldPtData=mapMath.getPathPointData(oldLinkNodes[i]);
			for(j=0;j<links.length;j++){
				if(oldPtData.PointID==links[j]){
					continue;
				}
				var idx=oldPtData.links.indexOf(links[j]);
				if(idx!=-1){
					oldPtData.links.splice(idx,1);
					this.updatePointStyle(oldLinkNodes[i]);
				}
			}
		}
		/*mapHistory.appendHistory({
			name:'插入点'
		});*/
		this.clearAddTemp();
	},
	//清理临时点
	clearAddTemp:function(){
		var tempPoints=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return item.mapData.type=='tempAddPath';
			}
			return false;
		});
		if(tempPoints.length<1){
			return;
		}
		tempPoints.forEach(function(item){
			edObj.mapBg.removeChild(item);
		});
		this.addTemp=null;
	},
	//删除选中点
	deletePoint:function(){
		if(this.selPt.length<1){
			return {
				server:[],
				local:[]
			};
		}
		var server=[],local=[];
		var pathData=[];
		var selPt=this.selPt;
		for(var i=selPt.length-1;i>-1;i--){
			var PointID=selPt[i].mapData.PointID,
				links=selPt[i].mapData.links;
			server.push({
				type:'delPoint',
				data:mapServerData.getDataFromNode('delPoint',selPt[i])
			});
			local.push({
				type:'delete',
				data:JSON.stringify(selPt[i].mapData)
			});
			/*(function(i){
				mapServerData.changeServer({//上传服务器数据
					type:'delPoint',
					data:mapServerData.getDataFromNode('delPoint',selPt[i])
				});
			})(i)*/
			if(links.length>1){
				
				/*(function(i){
					mapServerData.changeServer({
						type:'delPath',
						data:mapServerData.getDataFromNode('delPath',{
							sid:PointID,
							eid:links[i]
						})
					});
				})(i)*/
				var pts=mapMath.getNodeFromIds(links);
				for(var j=0;j<pts.length;j++){
					var ptData=mapMath.getPathPointData(pts[j]);
					ltemp={};
					ltemp.type='update';
					ltemp.from=JSON.stringify(pts[j].mapData);
					server.push({
						type:'delPath',
						data:mapServerData.getDataFromNode('delPath',{
							sid:PointID,
							eid:ptData.PointID
						},true)
					});
					var idx=ptData.links.indexOf(PointID);
					ptData.links.splice(idx,1);
					
					this.updatePointStyle(pts[j]);
					ltemp.to=JSON.stringify(pts[j].mapData);
					local.push(ltemp);
				}
			}
			edObj.mapBg.removeChild(selPt[i]);
			selPt.splice(i,1);
		}
		return {
			server:server,
			local:local
		};
	},
	//确定删除选中点
	deleteOk:function(){
		if(this.selPt.length<1){
			return;
		}
		var that=this;
		showConfirm({
			title:'确定删除这'+that.selPt.length+'个路径点？',
			callback:function(r){
				if(r===0){
					
					mapDetails.showSelPath();//更新详情
					var delData=that.deletePoint();
					mapHistory.appendHistory({
						name:'删除路径点',
						server:delData.server,
						local:delData.local
					});
				}
			}
		});
	},
	//路径点事件 拖拽和点击
	pathPointEvent:function(node){
		var that=this;
		node.interactive=true;
		//鼠标点下
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
		    	setTimeout(function(){//点击生效时间--半秒
		    		if(ptThat.isMousDown===true){
		    			ptThat.isMousDown=false;
		    		}
		    	},edObj.clickTime);
	    	}
			
			//移动路径点状态时 判定为拖动开始
	    	if (!this.dragging&&edObj.operStatus=='oper_click'&&mapPath.selPt.indexOf(this)!=-1) {
	    		dragStart(e,this);
		    }
		});
		//鼠标移动
		node.on('mousemove',function(e){
	    	//e.stopPropagation();
	    	
			//移动路径点状态时 判定为拖动中
	    	if (this.dragging&&edObj.operStatus=='oper_click'&&mapPath.selPt.indexOf(this)!=-1) {
	    		dragMove(e,this,function(node){
	    			that.pointMove(node);//拖动中 更新点状态
	    		});
		    }
		});
		//鼠标抬起
		node.on('mouseup',function(e){
			if(edObj.operStatus=='oper_click'){
				e.stopPropagation();
			}
	    	
	    	//点击状态
	    	if(edObj.operStatus=='oper_click'){
	    		if(this.isMousDown===true){//点击判定
					that.selectPoint(this);
				}
	    	}
			
			//移动状态时 判定为拖动结束
	    	if (this.dragging&&edObj.operStatus=='oper_click'&&mapPath.selPt.indexOf(this)!=-1) {
	    		dragEnd(e,this,function(node){
					var ltemp={};
					ltemp.type='update';
					ltemp.from=JSON.stringify(node.mapData);
					that.pointMove(node);//拖动结束 更新点状态
					
	    			//mapHistory.appendHistory({
					//	name:'移动路径点'
					//});
					mapDetails.showSelPath();//更新详情
					//mapServerData.changeServer({//上传服务器数据
					//	type:'updatePoint',
					//	data:mapServerData.getDataFromNode('updatePoint',node)
					//});

					var server=[],local=[];
					server.push({
						type:'updatePoint',
						data:mapServerData.getDataFromNode('updatePoint',node)
					});
					mapPath.updateOldData(node);
					ltemp.to=JSON.stringify(node.mapData);
					local.push(ltemp);
					mapHistory.appendHistory({
						name:'移动路径点',
						server:server,
						local:local
					});
	    		});
		    }
		});
		//鼠标外部抬起
		node.on('mouseupoutside',function(e){
			e.stopPropagation();
			
			//移动路径点状态时 判定为拖动结束
	    	if (this.dragging&&edObj.operStatus=='oper_click'&&mapPath.selPt.indexOf(this)!=-1) {
	    		dragEnd(e,this,function(node){
					var ltemp={};
					ltemp.type='update';
					ltemp.from=JSON.stringify(node.mapData);
	    			that.pointMove(node);//拖动结束 更新点状态
	    			//mapHistory.appendHistory({
					//	name:'移动路径点'
					//});
	    			mapDetails.showSelPath();//更新详情
	    			//mapServerData.changeServer({//上传服务器数据
					//	type:'updatePoint',
					//	data:mapServerData.getDataFromNode('updatePoint',node)
					//});

					var server=[],local=[];
					server.push({
						type:'updatePoint',
						data:mapServerData.getDataFromNode('updatePoint',node)
					});
					mapPath.updateOldData(node);
					ltemp.to=JSON.stringify(node.mapData);
					local.push(ltemp);
					mapHistory.appendHistory({
						name:'移动路径点',
						server:server,
						local:local
					});
	    		});
		    }
		});
	},
	//路径点移动时的数据更新
	pointMove:function(pt){
		pt.mapData.posData.x=pt.x+edObj.width/2;
		pt.mapData.posData.y=pt.y+edObj.height/2;
		this.updatePointStyle(pt);
		var linkNodes=[];
		if(pt.mapData.links&&pt.mapData.links.length>0){
			linkNodes=mapMath.getNodeFromIds(pt.mapData.links);
			/*linkNodes=edObj.mapBg.children.filter(function(item){
				var isLink=false;
				if(item.mapData&&(item.mapData.type=='path'||item.mapData.type=='polygon')&&pt.mapData.links.indexOf(item.mapData.uid)!=-1){
					isLink=true;
				}
				return isLink;
			});*/
		}
		for(var i=0;i<linkNodes.length;i++){
			this.updatePointStyle(linkNodes[i]);
		}
	},
	//连接选中路径点 bLink是否连接
	linkPoints:function(bLink){
		var paths=this.selPt;
		var areas=edObj.curNode;
		var pts=paths.concat(areas);
		if(pts.length<2){
			return;
		}
		var server=[],local=[];
		for(var i=0;i<pts.length;i++){
			var ltemp={};
			ltemp.type='update';
			ltemp.from=JSON.stringify(pts[i].mapData);
			local.push(ltemp);
		}
		for(var i=0;i<pts.length;i++){
			for(var j=0;j<pts.length;j++){
				if(i===j){
					continue;
				}
				var ptData_from=mapMath.getPathPointData(pts[i]),
					lks_from=ptData_from.links,
					ptid_from=ptData_from.PointID,
					ptData_to=mapMath.getPathPointData(pts[j]),
					lks_to=ptData_to.links,
					ptid_to=ptData_to.PointID;
				if(bLink){//连接 各选中点互相添加连接数据
					if(lks_from.indexOf(ptid_to)==-1){
						lks_from.push(ptid_to);
					}
					if(lks_to.indexOf(ptid_from)==-1){
						lks_to.push(ptid_from);
						server.push({
							type:'addPath',
							data:mapServerData.getDataFromNode('addPath',{
								sid:ptid_from,
								eid:ptid_to
							},true)
						})
						/*mapServerData.changeServer({
							type:'addPath',
							data:mapServerData.getDataFromNode('addPath',{
								sid:ptid_from,
								eid:ptid_to
							})
						});*/
					}
				}else{//取消连接 各选中点互相删除连接数据
					if(lks_from.indexOf(ptid_to)!=-1){
						lks_from.splice(lks_from.indexOf(ptid_to),1);
					}
					if(lks_to.indexOf(ptid_from)!=-1){
						lks_to.splice(lks_to.indexOf(ptid_from),1);
						server.push({
							type:'delPath',
							data:mapServerData.getDataFromNode('delPath',{
								sid:ptid_from,
								eid:ptid_to
							},true)
						})
						/*mapServerData.changeServer({
							type:'delPath',
							data:mapServerData.getDataFromNode('delPath',{
								sid:ptid_from,
								eid:ptid_to
							})
						});*/
					}
				}
				
			}
		}
		for(var i=0;i<pts.length;i++){
			this.updatePointStyle(pts[i]);
			local[i].to=JSON.stringify(pts[i].mapData);
		}
		mapHistory.appendHistory({
			name:'路径点连接状态变更',
			server:server,
			local:local
		});
		mapDetails.showSelPath();//更新详情
	},
	//选中路径点
	selectPoint:function(pt){
		var isSame=false;
		for(var i=0;i<this.selPt.length;i++){
			if(this.selPt[i]===pt){
				isSame=true;
				break;
			}
		}
		if(edObj.keyStatus.isCtrl===false){//单选
			if(isSame){
				return;
			}
			var pathPoints=this.getPathPoints();
			this.selPt=[];
			for(var i=0;i<pathPoints.length;i++){
				if(pathPoints[i]===pt){//选中点击的非选中点
					this.selPt[0]=pt;
					this.updatePointStyle(this.selPt[0],true);
				}else if(pathPoints[i].mapData&&pathPoints[i].mapData.selected==true){//其他点取消选择
					this.updatePointStyle(pathPoints[i],false);
				}
			}
		}else{//多选
			if(isSame){
				for(var i=0;i<this.selPt.length;i++){
					if(this.selPt[i]===pt){//点击选中点 则取消选择
						this.updatePointStyle(pt,false);
						break;
					}
				}
			}else{//选中点击的非选中点
				this.updatePointStyle(pt,true);
			}
		}
		mapDetails.showSelPath();//更新详情
	},
	//更新点状态 pt路径点对象 bSel是否选中，
	updatePointStyle:function(pt,bSel){
		if(bSel===undefined){//bSel不传参则保持原有选中状态
			bSel=pt.mapData.selected;
		}else{
			pt.mapData.selected=bSel;
		}
		var ptNode=pt,
			ptData=mapMath.getPathPointData(pt);
		if(pt.mapData.type=='polygon'){
			ptNode=pt.children.filter(function(item){
				return item.areaChildType=='polyPath';
			})[0].children.filter(function(item){
				return item.areaSubType=='point';
			})[0];
			var icon=ptNode.parent.children.filter(function(item){
				return item.areaSubType=='icon';
			});
			if(icon.length>0){
				if(pt.mapData.oldData.area.IconMapping){
					icon[0].visible=true;
				}else{
					icon[0].visible=false;
				}
			}
		}
		if(bSel){//选中状态绘制
			ptNode.clear();
			ptNode.beginFill(this.myStyle.selectColor);
			
			ptNode.lineStyle(this.myStyle.pathWidth,this.myStyle.pathColor);
			var links=ptData.links;
			if(links&&links.length>0){
				var pathPoints=this.getPathAndPolys();
				var sx=ptData.x;
				var sy=ptData.y;
				pathPoints.forEach(function(item){
					var thisPtData=mapMath.getPathPointData(item);
					if(links.indexOf(thisPtData.PointID)!=-1){
						ptNode.moveTo(0,0);
						ptNode.lineTo(thisPtData.x-sx,thisPtData.y-sy);
					}
				});
			}
			ptNode.lineStyle (2,0x000000);//this.myStyle.selectColor);//选中色--绿色
			ptNode.arc(0,0,edObj.pointRad*2-2);
			ptNode.drawCircle(0,0,edObj.pointRad*2);
			//ptNode.arc(0,0,8);
			//ptNode.drawCircle(0,0,10);
			
			ptNode.endFill();
			var selIdx=this.selPt.indexOf(pt);
			if(selIdx==-1&&pt.mapData.type=='path'){
				this.selPt.push(pt);
			}
		}else{//非选中状态绘制
			ptNode.clear();
			ptNode.beginFill(this.myStyle.nodeColor);
			
			ptNode.lineStyle (this.myStyle.pathWidth,this.myStyle.pathColor);
			var links=ptData.links;
			if(links&&links.length>0){
				var pathPoints=this.getPathAndPolys();
				var sx=ptData.x;
				var sy=ptData.y;
				pathPoints.forEach(function(item){
					var thisPtData=mapMath.getPathPointData(item);
					if(links.indexOf(thisPtData.PointID)!=-1){
						ptNode.moveTo(0,0);
						ptNode.lineTo(thisPtData.x-sx,thisPtData.y-sy);
					}
				});
			}
			
			
			ptNode.lineStyle (2,0x000000);
			ptNode.arc(0,0,edObj.pointRad*2-2);
			ptNode.drawCircle(0,0,edObj.pointRad*2);
			//ptNode.arc(0,0,8);
			//ptNode.drawCircle(0,0,10);
			
			ptNode.endFill();
			var selIdx=this.selPt.indexOf(pt);
			if(selIdx!=-1&&pt.mapData.type=='path'){
				this.selPt.splice(selIdx,1);
			}
		}
	},
	//获取所有路径点
	getPathPoints:function(){
		var ptNodes=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return item.mapData.type=='path';
			}else{
				return false;
			}
		});
		return ptNodes;
	},
	//获取可能连接的节点
	getPathAndPolys:function(){
		var ptNodes=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return (item.mapData.type=='path'||item.mapData.type=='polygon');
			}else{
				return false;
			}
		});
		return ptNodes;
	},
	//显示路径
	show:function(){
		var pathPoints=this.getPathPoints();
		if(pathPoints.length<1){
			return;
		}
		pathPoints.forEach(function(item){
			item.visible=true;
		});
		this.visible=true;
	},
	//隐藏路径
	hide:function(){
		this.clearTemp();
		this.clearAddTemp();
		var pathPoints=this.getPathPoints();
		if(pathPoints.length<1){
			return;
		}
		pathPoints.forEach(function(item){
			item.visible=false;
		});
		this.visible=false;
	},
	lockNode:function(node,bLock){
		
	},
	updateOldData:function(node){
		var data=node.mapData,
			oldData=data.oldData;
		oldData.X=Math.round(data.posData.x);
		oldData.Y=Math.round(data.posData.y);
	},
}