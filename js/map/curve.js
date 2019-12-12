//曲线区域
var mapCurve={
	selNode:[],
	append:function(points,color){
		color=color||'0x000000';
		var temp=new PIXI.Graphics();
		temp.beginFill(color);
		temp.lineStyle(mapPolygon.myStyle.borderWidth,mapPolygon.myStyle.borderColor);
		temp.mapData={};
		
		temp.mapData={};
		var rect=mapMath.getRectFromCurveArys([points]);

		var centerX=rect.width/2;
		var centerY=rect.height/2;
		temp.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		for(var i=1;i<points.length;i++){
			if(points[i].type=='normal'){
				temp.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
			}else if(points[i].type=='curve'){
				var cpx=points[i].cp1.x-rect.left-centerX,
					cpy=points[i].cp1.y-rect.top-centerY,
					cpx2=points[i].cp2.x-rect.left-centerX,
					cpy2=points[i].cp2.y-rect.top-centerY,
					tox=points[i].x-rect.left-centerX,
					toy=points[i].y-rect.top-centerY,
					fromx=points[i-1].x-rect.left-centerX,
					fromy=points[i-1].y-rect.top-centerY;
				temp.bezierCurveTo(cpx,cpy,cpx2,cpy2,tox,toy);
			}
			
		}
		temp.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		temp.mapData.type='curve';
		temp.mapData.color=color;
		temp.mapData.posData={
			x:rect.left,
			y:rect.top,
			center:{
				x:centerX,
				y:centerY
			},
			points:points
		}
		temp.endFill();
		temp.x=rect.left-edObj.width/2+centerX;
		temp.y=rect.top-edObj.height/2+centerY;
		
		this.bindEvent(temp);
		edObj.mapBg.addChild(temp);
	},
	getCurves:function(){
		var curves=edObj.mapBg.children.filter(function(item){
			if(item.mapData){
				return item.mapData.type=='curve';
			}else{
				return false;
			}
		});
		return curves;
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
			if(edObj.operStatus=='oper_click'||edObj.operStatus=='oper_move'){
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
	    	
	    	//拖拽开始
			if (!this.dragging&&edObj.operStatus=='oper_move') {
				var isSel=false;
				for(var i=0;i<that.selNode.length;i++){
					if(that.selNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragStart(e,this,function(node){
						for(var i=0;i<that.selNode.length;i++){
							if(that.selNode[i]!=node){
								that.selNode[i].startPi={};
								that.selNode[i].startPi.x=that.selNode[i].x;
								that.selNode[i].startPi.y=that.selNode[i].y;
							}
						}
					});
				}else{//未选中拖动(单体)
					dragStart(e,this);
				}
			}
		});
		node.on('mousemove',function(e){
			//拖拽中
			if (this.dragging&&edObj.operStatus=='oper_move') {
				var isSel=false;
				for(var i=0;i<that.selNode.length;i++){
					if(that.selNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragMove(e,this,function(node){
						var difX=node.x-node.startPi.x;
						var difY=node.y-node.startPi.y;
						for(var i=0;i<that.selNode.length;i++){
							if(that.selNode[i]!=node){
								that.selNode[i].x=that.selNode[i].startPi.x+difX;
								that.selNode[i].y=that.selNode[i].startPi.y+difY;
							}
						}
					});
				}else{//未选中拖动(单体)
					dragMove(e,this);
				}
			}
		});
		node.on('mouseup',function(e){
			if(edObj.operStatus=='oper_click'||edObj.operStatus=='oper_move'){
				e.stopPropagation();
			}
			//点击状态
	    	if(edObj.operStatus=='oper_click'){
	    		if(this.isMousDown===true){//点击判定
					that.selectNode(this);
				}
	    	}

			//拖拽结束
			if (this.dragging&&edObj.operStatus=='oper_move') {
				var isSel=false;
				for(var i=0;i<that.selNode.length;i++){
					if(that.selNode[i]===this){
						isSel=true;
						break;
					}
				}
				if(isSel){//选中拖动(可能群体)
					dragEnd(e,this,function(node){
						for(var i=0;i<that.selNode.length;i++){
							that.selNode.startPi=null;
							mapCurve.updateCurvePos('move',that.selNode[i]);
						}
						mapHistory.appendHistory({
							name:'移动'
						});
					});
				}else{//未选中拖动(单体)
					dragEnd(e,this,function(node){
						mapCurve.updateCurvePos('move',node);
						mapHistory.appendHistory({
							name:'移动'
						});
					});
				}
			}
		});
		//拖拽end
	},
	//选中多边形 bSelect强制执行选中操作
	selectNode:function(node,bSelect){
		if(bSelect){
			node.mapData.selected=true;
			node.alpha=0.5;
		}else{
			node.mapData.selected=false;
			node.alpha=1;
		}
		var isSame=false;
		for(var i=0;i<this.selNode.length;i++){
			if(this.selNode[i]===node){
				isSame=true;
				break;
			}
		}
		if(edObj.keyStatus.isCtrl===false){//单选
			if(isSame){
				return;
			}
			var childs=this.getCurves();
			this.selNode=[];
			for(var i=0;i<childs.length;i++){
				if(childs[i]===node){//选择
					node.mapData.selected=true;
					node.alpha=0.5;
					this.selNode[0]=node;
					//this.editNodeMode(this.selNode[0],true);
					//$('.detailBg').html(JSON.stringify(node.mapData.posData));
				}else if(childs[i].mapData&&childs[i].mapData.selected==true){//取消选择
					childs[i].mapData.selected=false;
					childs[i].alpha=1;
					//this.editNodeMode(childs[i],false);
				}
			}
		}else{//多选
			if(isSame){
				for(var i=0;i<this.selNode.length;i++){
					if(this.selNode[i]===node){//取消选择
						node.mapData.selected=false;
						node.alpha=1;
						//this.editNodeMode(node,false);
						var idx=this.selNode.indexOf(node);
						this.selNode.splice(idx,1);
						break;
					}
				}
			}else{//选择
				node.mapData.selected=true;
				node.alpha=0.5;
				this.selNode.push(node);
				//this.editNodeMode(node,true);
			}
		}
		mapDetails.showSelPolygon();//多边形详情
	},
	//更新多边形位置数据type 'move' 'rot'
	updateCurvePos:function(type,node){
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
				if(posData.points[i].type=='curve'){
					posData.points[i].cp1.x+=difx;
					posData.points[i].cp1.y+=dify;
					posData.points[i].cp2.x+=difx;
					posData.points[i].cp2.y+=dify;
				}
			}
			posData.x=newx+edObj.width/2-posData.center.x;
			posData.y=newy+edObj.height/2-posData.center.y;
			//mapDetails.showSelPolygon();//多边形详情
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
			this.reapintCurve(node,newPoints);
			//mapDetails.showSelPolygon();//多边形详情
		}
	},
	//重绘多边形
	reapintCurve:function(node,points,color){
		var operType='resize';
		if(node.mapData.posData.points.length!=points.length){
			operType='changePoint';
		}
		color=color||node.mapData.color||0x000000;
		node.clear();
		node.beginFill(color);
		node.lineStyle(1,0x000000);
		
		var rect=mapMath.getRectFromCurveArys([points]);

		var centerX=rect.width/2;
		var centerY=rect.height/2;
		node.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
		for(var i=1;i<points.length;i++){
			if(points[i].type=='normal'){
				node.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
			}else if(points[i].type=='curve'){
				var cpx=points[i].cp1.x-rect.left-centerX,
					cpy=points[i].cp1.y-rect.top-centerY,
					cpx2=points[i].cp2.x-rect.left-centerX,
					cpy2=points[i].cp2.y-rect.top-centerY,
					tox=points[i].x-rect.left-centerX,
					toy=points[i].y-rect.top-centerY,
					fromx=points[i-1].x-rect.left-centerX,
					fromy=points[i-1].y-rect.top-centerY;
				node.bezierCurveTo(cpx,cpy,cpx2,cpy2,tox,toy);
			}
			
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
		if(operType=='resize'){
			//this.rePosChildren(node);
		}else if(operType=='changePoint'){
			//this.editNodeMode(node,true);
		}
	},
	//绘制多边形
	print:{
		data:null,
		tempRect:null,
		//确定添加区域
		Ok:function(){
			if(!this.data){
				return;
			}
			/*var points=[];
			for(var i=0;i<this.data.length;i++){
				if(this.data[i].visible){
					points.push({
						x:this.data[i].x+edObj.width/2,
						y:this.data[i].y+edObj.height/2
					});
				}
			}*/
			var points=this.data.filter(function(item){
				return item.visible;
			});
			if(points.length<1){
				return;
			}
			console.log(points);
			points=points.map(function(item){
				var obj={
					x:item.x+edObj.width/2,
					y:item.y+edObj.height/2,
					type:item.type
				};
				if(obj.type=="curve"){
					obj.cp1={
						x:item.cp1.x+edObj.width/2,
						y:item.cp1.y+edObj.height/2,
					};
					obj.cp2={
						x:item.cp2.x+edObj.width/2,
						y:item.cp2.y+edObj.height/2,
					};
				}
				return obj;
			});
			
			if(points.length<1){return;}
			mapCurve.append(points,mapPolygon.myStyle.fillColor);
			mapHistory.appendHistory({
				name:'绘制'
			});
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
						if(this.data[i].type=="curve"){
							logHtml+='[cp1]:'+(this.data[i].cp1.x+edObj.width/2)+','+(this.data[i].cp1.y+edObj.height/2)+'<br>';
							logHtml+='[cp2]:'+(this.data[i].cp2.x+edObj.width/2)+','+(this.data[i].cp2.y+edObj.height/2)+'<br>';
						}
					}else{
						logHtml+='<span style="color:#f00">['+i+']:'+x+','+y+'</span><br>';
						if(this.data[i].type=="curve"){
							logHtml+='<span style="color:#f00">[cp1]:'+(this.data[i].cp1.x+edObj.width/2)+','+(this.data[i].cp1.y+edObj.height/2)+'</span><br>';
							logHtml+='<span style="color:#f00">[cp2]:'+(this.data[i].cp2.x+edObj.width/2)+','+(this.data[i].cp2.y+edObj.height/2)+'</span><br>';
						}
					}
				}
			}
			$('#printCurve_log').html(logHtml);
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
					if(item.type=='curve'){
						edObj.mapBg.removeChild(item.cp1);
						edObj.mapBg.removeChild(item.cp2);
					}
					item=null;
					
				}
				return item!=null;
			});
			//清理历史记录中的无效点 end
			
			var type='normal';
			if($('input[name="operCurveStatus"]:checked').val()=='oper_Curve_Curve'){
				type='curve';
			}
			var temp={};
			temp.type=type;
			temp.node=new PIXI.Graphics();
			temp.x=point.x;
			temp.y=point.y;
			temp.node.beginFill(0xff0000,0);
			temp.node.lineStyle(2);
			if(this.data.length>0){
				var lastPoint=this.data[this.data.length-1];
				if(type=='normal'){
					temp.node.moveTo(lastPoint.x-point.x,lastPoint.y-point.y);
					temp.node.lineTo(0,0);
				}else if(type=='curve'){
					this.createControlPoint(lastPoint,temp);
					temp.node.moveTo(lastPoint.x-point.x,lastPoint.y-point.y);
					var cpx=temp.cp1.x-point.x,
						cpy=temp.cp1.y-point.y,
						cpx2=temp.cp2.x-point.x,
						cpy2=temp.cp2.y-point.y,
						tox=0,
						toy=0;
					temp.node.bezierCurveTo(cpx,cpy,cpx2,cpy2,tox,toy);
				}
			}else{
				temp.type='normal';
			}
			temp.node.drawCircle(0,0,5);
			temp.node.x=point.x;
			temp.node.y=point.y;
			temp.node.endFill();
			temp.visible=true;
			
			edObj.mapBg.addChild(temp.node);
			this.data.push(temp);
			this.paintTempArea();
			this.updateLog();
			
			var that=this;
			if(sameIdx===0){
				showConfirm({
					title:'已经闭环，是否生成多边形？',
					btns:['生成','继续绘制'],
					callback:function(idx){
						if(idx===0){
							that.Ok();
						}
					}
				});
			}
		},
		//创建控制点
		createControlPoint:function(sNode,eNode){
			var nodes=['',sNode,eNode];
			mapMath.getVertPoint({x:sNode.x,y:sNode.y},{x:eNode.x,y:eNode.y});
			for(var i=1;i<3;i++){
				var cp=new PIXI.Graphics();
				cp.beginFill(0xff0000);
				
				cp.lineStyle(2,0xffff00);
				
				cp.moveTo(0,0);
				cp.lineTo(-50,-50);
				

				cp.drawCircle(0,0,5);
				cp.x=nodes[i].x+50;
				cp.y=nodes[i].y+50;
				cp.endFill();
				eNode['cp'+i]=cp;
				edObj.mapBg.addChild(cp);
				this.cpEvent(cp);
			}
		},
		//控制点事件
		cpEvent:function(node){
			var that=this;
			node.interactive=true;
			//鼠标点下
		    node.on('mousedown',function(e){
				e.stopPropagation();
				
				//移动路径点状态时 判定为拖动开始
		    	if (!this.dragging) {
		    		dragStart(e,this);
			    }
			});
			//鼠标移动
			node.on('mousemove',function(e){
	
				//移动路径点状态时 判定为拖动中
		    	if (this.dragging) {
		    		dragMove(e,this,function(node){
		    			that.updateCurveCp(node);//控制点移动更新
		    		});
			    }
			});
			//鼠标抬起
			node.on('mouseup',function(e){
				e.stopPropagation();
				
				//移动状态时 判定为拖动结束
		    	if (this.dragging) {
		    		dragEnd(e,this,function(node){
		    			that.updateCurveCp(node);//控制点移动更新
		    			that.updateLog();//更新log
		    		});
			    }
			});
			//鼠标外部抬起
			node.on('mouseupoutside',function(e){
				e.stopPropagation();
				
				//移动路径点状态时 判定为拖动结束
		    	if (this.dragging&&edObj.operStatus=='oper_move') {
		    		dragEnd(e,this,function(node){
		    			that.updateCurveCp(node);//控制点移动更新
		    			that.updateLog();//更新log
		    		});
			    }
			});
		},
		updateCurveCp:function(node){
			var idx=-1;
			for(var i=0;i<this.data.length;i++){
				if(this.data[i].cp1===node||this.data[i].cp2===node){
					idx=i;
					break;
				}
			};
			
			var cp1=this.data[idx].cp1,
				cp2=this.data[idx].cp2,
				pt=this.data[idx].node,
				lastPt=this.data[idx-1].node;
			cp1.clear();
			cp1.beginFill(0xff0000);
			cp1.lineStyle(2,0xffff00);
			cp1.moveTo(0,0);
			cp1.lineTo(lastPt.x-cp1.x,lastPt.y-cp1.y);
			cp1.drawCircle(0,0,5);
			cp1.endFill();
			
			cp2.clear();
			cp2.beginFill(0xff0000);
			cp2.lineStyle(2,0xffff00);
			cp2.moveTo(0,0);
			cp2.lineTo(pt.x-cp2.x,pt.y-cp2.y);
			cp2.drawCircle(0,0,5);
			cp2.endFill();
			
			pt.clear();
			pt.beginFill(0xff0000,0);
			pt.lineStyle(2);
			pt.moveTo(lastPt.x-pt.x,lastPt.y-pt.y);
			var cpx=cp1.x-pt.x,
				cpy=cp1.y-pt.y,
				cpx2=cp2.x-pt.x,
				cpy2=cp2.y-pt.y,
				tox=0,
				toy=0;
			pt.bezierCurveTo(cpx,cpy,cpx2,cpy2,tox,toy);
			pt.drawCircle(0,0,5);
			
			this.paintTempArea();
		},
		//清空
		clear:function(){
			if(!this.data){
				return;
			}
			for(var i=0;i<this.data.length;i++){
				edObj.mapBg.removeChild(this.data[i].node);
				if(this.data[i].type=='curve'){
					edObj.mapBg.removeChild(this.data[i].cp1);
					edObj.mapBg.removeChild(this.data[i].cp2);
				}
				this.data[i]=null;
			}
			if(this.tempRect){
				edObj.mapBg.removeChild(this.tempRect);
			}
			this.data=null;
			this.tempRect=null;
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
			if(this.data[idx].type=='curve'){
				this.data[idx].cp1.visible=false;
				this.data[idx].cp2.visible=false;
			}
			this.paintTempArea();
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
			if(this.data[idx].type=='curve'){
				this.data[idx].cp1.visible=true;
				this.data[idx].cp2.visible=true;
			}
			this.paintTempArea();
			this.updateLog();
		},
		//绘制临时多边形
		paintTempArea:function(){
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
				var obj={
					x:item.x+edObj.width/2,
					y:item.y+edObj.height/2,
					type:item.type
				};
				if(obj.type=="curve"){
					obj.cp1={
						x:item.cp1.x+edObj.width/2,
						y:item.cp1.y+edObj.height/2,
					};
					obj.cp2={
						x:item.cp2.x+edObj.width/2,
						y:item.cp2.y+edObj.height/2,
					};
				}
				return obj;
			});
			this.tempRect.mapData={};
			var rect=mapMath.getRectFromCurveArys([points]);

			var centerX=rect.width/2;
			var centerY=rect.height/2;
			this.tempRect.moveTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			for(var i=1;i<points.length;i++){
				if(points[i].type=='normal'){
					this.tempRect.lineTo(points[i].x-rect.left-centerX,points[i].y-rect.top-centerY);
				}else if(points[i].type=='curve'){
					var cpx=points[i].cp1.x-rect.left-centerX,
						cpy=points[i].cp1.y-rect.top-centerY,
						cpx2=points[i].cp2.x-rect.left-centerX,
						cpy2=points[i].cp2.y-rect.top-centerY,
						tox=points[i].x-rect.left-centerX,
						toy=points[i].y-rect.top-centerY,
						fromx=points[i-1].x-rect.left-centerX,
						fromy=points[i-1].y-rect.top-centerY;
					this.tempRect.bezierCurveTo(cpx,cpy,cpx2,cpy2,tox,toy);
				}
				
			}
			this.tempRect.lineTo(points[0].x-rect.left-centerX,points[0].y-rect.top-centerY);
			this.tempRect.mapData.type='tempCurve';
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
		}
	},
}
