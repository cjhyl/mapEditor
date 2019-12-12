var mapBg={
	init:function(){
		var bg = new PIXI.Graphics();

		//设置填充和绘制线样式
		bg.beginFill(edObj.bgClr);
		bg.lineStyle(1,0x000000);
		
		var wBg=edObj.width,
			hBg=edObj.height;
		//绘制画板
		bg.moveTo(-wBg/2,-hBg/2);
		bg.lineTo(wBg/2, -hBg/2);
		bg.lineTo(wBg/2, hBg/2);
		bg.lineTo(-wBg/2, hBg/2);
		
		bg.endFill();
		
		//绘制网格
		var wGrid=edObj.gridWidth,
			hGrid=edObj.gridHeight,
			row=parseInt(hBg/hGrid),
			col=parseInt(wBg/wGrid);
		for(var i=0;i<row;i++){
			bg.moveTo(-wBg/2,i*hGrid-hBg/2);
			bg.lineTo(wBg/2,i*hGrid-hBg/2);
		}
		for(var j=0;j<col;j++){
			bg.moveTo(j*wGrid-wBg/2,-hBg/2);
			bg.lineTo(j*wGrid-wBg/2,hBg/2);
		}
		
		return bg;
	},
	//事件绑定
	bindEvent:function(){
		edObj.mapBg.interactive=true;
		//鼠标点击
		edObj.mapBg.on('click',function(e){
			//选择
			if(edObj.operStatus=='oper_click'){
				for(var i=edObj.curNode.length-1;i>-1;i--){
					mapPolygon.selectNode(edObj.curNode[i],false)
				}
				for(var i=mapPath.selPt.length-1;i>-1;i--){
					mapPath.updatePointStyle(mapPath.selPt[i],false);
				}
				mapDetails.clear();
			}
			//绘制多边形
			if(edObj.operStatus=='oper_polygon'){
				mapPolygon.print.printPoint(e.data.getLocalPosition(this));
			}
			//绘制曲线多边形
			/*if(edObj.operStatus=='oper_Curve'){
				mapCurve.print.printPoint(e.data.getLocalPosition(this));
			}*/
			//路径点
			if(edObj.operStatus=='oper_path'){
				mapPath.printPoint(e.data.getLocalPosition(this));
			}
			//插入路径点
			if(edObj.operStatus=='oper_insertPathPoint'){
				mapPath.printAddPoint(e.data.getLocalPosition(this));
			}
			//插入区域点
			//if(edObj.operStatus=='oper_insertAreaPoint'){
			//	mapPolygon.editAddPoint(e.data.getLocalPosition(this));
			//}
			//分割
			if(edObj.operStatus=='oper_clip'){
				if(edObj.curNode.length<1){
					return;
				}
				mapPolygon.clip.printPoint(e.data.getLocalPosition(this));
			}
			//选择模板点击
			if(edObj.operStatus=='oper_mould'){
				var mouldId=$('input[name="clickMoulds"]:checked').val();
				if(!mouldId){
					return;
				}
				if(mouldId){
					var mapPos=e.data.getLocalPosition(this);
					mapPos={
						x:mapPos.x+edObj.width/2,
						y:mapPos.y+edObj.height/2
					};
					for(var i=0;i<mapMoulde.data.length;i++){
						if(mapMoulde.data[i].uid==mouldId){
							mapMoulde.append(mapMoulde.data[i].points,mapPos,mapMoulde.data[i].color);
							break;
						}
					}
				}
			}
			
			
			/*//编辑增加点位
			if(edObj.status.value=='editEle'&&$('input[name="editStatus"]:checked').val()=='editStatus_addPoint'){
				if(edObj.curNode.length<1){
					return;
				}
				mapPolygon.editAddPoint(e.data.getLocalPosition(this));
			}
			//切线分割区域
			if(edObj.status.value=='editEle'&&$('input[name="editStatus"]:checked').val()=='editStatus_clip'){
				if(edObj.curNode.length<1){
					return;
				}
				mapPolygon.clip.printPoint(e.data.getLocalPosition(this));
			}
			//选择模板点击
			if(edObj.status.value=='moulds'&&$('input[name="mouldStatus"]:checked').val()=='clickMould'){
				var mouldName=$('input[name="clickMoulds"]:checked').val();
				if(mouldName){
					var mapPos=e.data.getLocalPosition(this);
					mapPos={
						x:mapPos.x+edObj.width/2,
						y:mapPos.y+edObj.height/2
					};
					mapMoulde.append(mapMoulde.data[mouldName],mapPos);
				}
			}
			//路径点
			if(edObj.status.value=='editPath'){
				var pathStatus=$('input[name="editPath_status"]:checked').val();
				//创建路径点
				if(pathStatus=='createPathPoint'){
					mapPath.printPoint(e.data.getLocalPosition(this));
				}
				//增加路径点
				if(pathStatus=='addPathPoint'){
					mapPath.printAddPoint(e.data.getLocalPosition(this));
				}
				
			}*/
		})
		//鼠标点击 end
		//鼠标拖拽
	    edObj.mapBg.on('mousedown',function(e){
	    	if (!this.dragging&&edObj.operStatus=='oper_move') {
	    		dragStart(e,this);
		    }
		});
		edObj.mapBg.on('mousemove',function(e){
			//加点
			if(edObj.operStatus=='oper_click11111'){
				mapPolygon.editAddPoint.paintTempPt(e.data.getLocalPosition(this));
			}
			if (this.dragging&&edObj.operStatus=='oper_move') {
				dragMove(e,this);
			}
			//绘制多边形时的临时虚线
			if(edObj.operStatus=='oper_polygon'){
				mapPolygon.print.paintTempLine(e.data.getLocalPosition(this));
			}
		});
		edObj.mapBg.on('mouseup',function(e){
	    	if (this.dragging&&edObj.operStatus=='oper_move') {
	    		dragEnd(e,this);
	    		mapRuler.change();
		    }
		});
		//鼠标拖拽 end
	},
	//缩放--大
	toBig:function(){
		var scale=edObj.mapBg.scale.x;
		scale*=1.1;
		if(scale>4){
			scale=4;
		}
		this.toScale(scale);
	},
	//缩放--小
	toSmall:function(){
		var scale=edObj.mapBg.scale.x;
		scale*=0.9;
		if(scale<0.1){
			scale=0.1;
		}
		this.toScale(scale);
	},
	//缩放
	toScale:function(sc){
		var oldCenter=mapMath.getMapPointInAppCenter();
		edObj.mapBg.scale.x=sc;
		edObj.mapBg.scale.y=sc;
		var newCenter=mapMath.getMapPointInAppCenter();
		var offsetX=(oldCenter.x-newCenter.x)*sc;
		var offsetY=(oldCenter.y-newCenter.y)*sc;
		edObj.mapBg.x=edObj.mapBg.x-offsetX;
		edObj.mapBg.y=edObj.mapBg.y-offsetY;
		
		mapRuler.change();
	},
	//添加背景图片
	importImage:function(file){
		var f=file.files[0];
		if(!f){
			return;
		}
		var fr = new FileReader();
	    fr.onload = function(e) {
	        var src = e.target.result;
	        var bg = PIXI.Sprite.fromImage(src);
			bg.mapData={};
			bg.mapData.type='background';
			bg.x = -edObj.width/2;
			bg.y = -edObj.height/2;
			bg.width = edObj.width;
			bg.height = edObj.height;
			
			var childs=edObj.mapBg.children;
			if(childs[0]&&childs[0].mapData&&childs[0].mapData.type=='background'){
				edObj.mapBg.removeChild(childs[0]);
			}
			edObj.mapBg.addChild(bg);
			mapMath.moveAryItem(childs,childs.length-1,0);
	    }
	    fr.readAsDataURL(f);
	},
	//添加背景图片
	importImageFromUrl:function(url){
		mapMath.getBase64FromUrl(url,function(b64){
			var bg = PIXI.Sprite.fromImage(b64);
			bg.mapData={};
			bg.mapData.type='background';
			bg.x = -edObj.width/2;
			bg.y = -edObj.height/2;
			bg.width = edObj.width;
			bg.height = edObj.height;
			
			var childs=edObj.mapBg.children;
			if(childs[0]&&childs[0].mapData&&childs[0].mapData.type=='background'){
				edObj.mapBg.removeChild(childs[0]);
			}
			edObj.mapBg.addChild(bg);
			mapMath.moveAryItem(childs,childs.length-1,0);
		});
	}
}
