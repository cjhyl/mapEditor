var edObj={
	operStatus:'oper_move',
	exportType:'txt',
	width:5000,//画布宽
	height:5000,//画布高
	gridWidth:100,//画布格子宽
	gridHeight:100,//画布格子高
	bgClr:0xf2f2f2,//画布背景色
	app:null,//画布的pixi的app对象
	mapBg:null,//画布的pixi的节点对象
	mapEle:null,//画布的jq的dom对象
	curNode:[],//选中区域
	pointRad:5,//点元素半径
	keyStatus:{
		isCtrl:false,
		isShift:false
	},
	copyData:{},
	historyData:[],
	showRuler:true,
	clickTime:500,
	uid:new Date().valueOf(),
	doing:null
}
/*
 由节点坐标求实际坐标
x=node.x+edObj.width/2-node.mapData.posData.center.x
y=node.y+edObj.height/2-node.mapData.posData.center.y
由实际坐标求节点坐标
node.x=x-edObj.width/2+node.mapData.posData.center.x
node.y=y-edObj.width/2+node.mapData.posData.center.y
*/
$(function(){
	mapMoulde.init();//模板
	mapTopMenu.init();//顶部菜单
	mapBgInit();//画板初始化
	operEvents();//控制面板事件
	mapKeyEvents();//按键事件
	mapBgEvents();//画板事件
	mapHistory.init();//从缓存中读取历史记录
	mapRuler.change();//尺标
	mapServerData.init();
});
//按键事件
function mapKeyEvents(){
	$('body').on('keydown',function(e){
		e=e||event; 
       	
		var kc=e.keyCode;
		console.log('keycode',kc);
		if(kc==37||kc==38||kc==39||kc==40){
			e.preventDefault();
		}
		if(kc==16){
			edObj.keyStatus.isShift=true;
		}
		if(kc==17){
			edObj.keyStatus.isCtrl=true;
		}
		if(kc==37){//左
			if(edObj.curNode.length<1){
				return;
			}
			if(edObj.status.value=='rotEle'){
				mapKeyAction('rotLeft');
				return;
			}
			if(edObj.operStatus=='oper_move'){
				mapKeyAction('moveLeft');
				return;
			}
			return;
		}
		if(kc==38){//上
			if(edObj.curNode.length<1){
				return;
			}
			if(edObj.operStatus=='oper_move'){
				mapKeyAction('moveUp');
				return;
			}
			return;
		}
		if(kc==39){//右
			if(edObj.curNode.length<1){
				return;
			}
			if(edObj.status.value=='rotEle'){
				mapKeyAction('rotRight');
				return;
			}
			if(edObj.operStatus=='oper_move'){
				mapKeyAction('moveRight');
				return;
			}
			return;
		}
		if(kc==40){//下
			if(edObj.curNode.length<1){
				return;
			}
			if(edObj.operStatus=='oper_move'){
				mapKeyAction('moveDown');
				return;
			}
			return;
		}
		if(kc==67){//c
			if(edObj.curNode.length<1||!edObj.keyStatus.isCtrl||!$(document.activeElement).is('body')){
				return;
			}
			mapPolygon.copy(false);//复制
			return;
		}
		if(kc==86){//v
			if(!edObj.keyStatus.isCtrl||!$(document.activeElement).is('body')){
				return;
			}
			mapPolygon.paste();//粘贴
			return;
		}
		if(kc==88){//x
			if(edObj.curNode.length<1||!edObj.keyStatus.isCtrl||!$(document.activeElement).is('body')){
				return;
			}
			mapPolygon.copy(true);//剪切
			return;
		}
		if(kc==46){//delete
			mapTopMenu.delete();//删除
			return;
		}
		if(kc==107||kc==187){//+
			if(!edObj.keyStatus.isCtrl){
				return;
			}
			e.preventDefault();
			mapBg.toBig();//放大地图
			return;
		}
		if(kc==109||kc==189){//-
			if(!edObj.keyStatus.isCtrl){
				return;
			}
			e.preventDefault();
			mapBg.toSmall();//缩小地图
			return;
		}
		if(kc==90){//z
			if(!edObj.keyStatus.isCtrl){
				return;
			}
			mapHistory.goPrev();//上一步
			return;
		}
		if(kc==89){//y
			if(!edObj.keyStatus.isCtrl){
				return;
			}
			mapHistory.goNext();//下一步
			return;
		}
	})
	$('body').on('keyup',function(e){
		var kc=e.keyCode;
		switch(kc){
			case 16:{//shift
				edObj.keyStatus.isShift=false;
			}
			break;
			case 17:{//ctrl
				edObj.keyStatus.isCtrl=false;
			}
			break;
		}
	})
}
var keyActTimer=null
function mapKeyAction(act){
	/*if(act.indexOf('rot')!=-1){
		var angel=0.01;
		if(act=='rotRight'){
			angel=-0.01;
		}
		edObj.curNode.forEach(function(node){
			node.rotation=node.rotation+angel;
		});
		clearTimeout(keyActTimer);
		keyActTimer=setTimeout(function(){
			edObj.curNode.forEach(function(node){
				mapPolygon.updatePolygonPos('rot',node);
			});
			mapHistory.appendHistory('旋转');
		},100);
		return;
	}*/
	if(act.indexOf('move')!=-1){
		var moveX=0;
		var moveY=0;
		if(act=='moveLeft'){
			moveX=-1;
		}
		if(act=='moveUp'){
			moveY=-1;
		}
		if(act=='moveRight'){
			moveX=1;
		}
		if(act=='moveDown'){
			moveY=1;
		}
		edObj.curNode.forEach(function(node){
			node.x=node.x+moveX;
			node.y=node.y+moveY;
		});
		clearTimeout(keyActTimer);
		keyActTimer=setTimeout(function(){
			edObj.curNode.forEach(function(node){
				mapPolygon.updatePolygonPos('move',node);
			});
			//mapHistory.appendHistory({
			//	name:'移动'
			//});
		},100);
	}
}
//重绘地图
function rePaintMap(data,operFrom){
	if(!edObj.mapBg){
		return;
	}
	edObj.mapBg.removeChildren();
	if(data.polygons){
		for(var i=0;i<data.polygons.length;i++){
			var pts=data.polygons[i].points,
				color=data.polygons[i].color,
				areaId=data.polygons[i].areaID,
				PointID=null,
				pathPt=null,
				links=null;
			if(data.polygons[i].path){
				pathPt={
					x:data.polygons[i].path.x,
					y:data.polygons[i].path.y
				};
				PointID=data.polygons[i].path.PointID,
				links=data.polygons[i].path.links;
			}
			var node=mapPolygon.append({
				points:pts,
				color:color,
				areaId:areaId,
				PointID:PointID,
				pathPt:pathPt,
				pathLinks:links,
				oldData:data.polygons[i].oldData
			});
			if(data.polygons[i].oldData.area.Name){
				mapPolygon.addText(node,data.polygons[i].oldData.area);
			}
			if(data.polygons[i].logo){
				mapPolygon.addLogo(node,data.polygons[i].logo);
			}
		}
	}
	/*if(data.curves){
		for(var i=0;i<data.curves.length;i++){
			var node=mapCurve.append(data.curves[i].points,data.curves[i].color);
			if(data.curves[i].label){
				mapCurve.addText(node,data.curves[i].label);
			}
			if(data.curves[i].logo){
				mapCurve.addLogo(node,data.curves[i].logo);
			}
		}
	}*/
	if(data.paths){
		for(var i=0;i<data.paths.length;i++){
			var temp=mapPath.appendPathPoint({x:data.paths[i].x,y:data.paths[i].y},[],data.paths[i].PointID,data.paths[i].oldData).node;
			temp.mapData.links=data.paths[i].links;
			/*if(operFrom!='fromServer'){
				temp.mapData.oldData=data.paths[i].oldData;
			}*/
		}
		var pathPoints=mapPath.getPathAndPolys();
		pathPoints.forEach(function(item){
			mapPath.updatePointStyle(item);
		});
	}
	if(operFrom!='fromHistory'){
		/*mapHistory.appendHistory({
			name:'重绘'
		});*/
	}
}

/*function setOperVisible(ele){
	debugger;
	var operBg=$('.operBg');
	var closeBtn=$('#closeOper');
	var openBtn=$('#openOper');
	if(ele.id=='closeOper'){
		operBg.hide();
		closeBtn.hide();
		openBtn.show();
		mapRuler.vBg.css('left',0);
	}
	if(ele.id=='openOper'){
		operBg.show();
		closeBtn.show();
		openBtn.hide();
		mapRuler.vBg.css('left','74px');
	}
}*/
//编辑状态变化时的处理
function operStatusChange(){
	//清理绘制多边形_临时区域、点
	if(edObj.operStatus!='oper_polygon'){
		mapPolygon.print.clear();
	}
	//清理绘制曲线多边形_临时区域、点
	/*if(edObj.operStatus!='oper_curve'){
		mapCurve.print.clear();
	}*/
	//清理绘制路径点_临时点
	if(edObj.operStatus!='oper_path'){
		mapPath.clearTemp();
	}
	//清理插入路径点_临时点
	if(edObj.operStatus!='oper_addPathPoint'){
		mapPath.clearAddTemp();
	}
	
	/*//缩放区域
	if(edObj.operStatus=='oper_scaleArea'){
		mapPolygon.areaScale.show();//显示缩放框
	}else{
		mapPolygon.areaScale.hide();//隐藏缩放框
	}
	
	//编辑区域点和插入区域点
	if(edObj.operStatus=='oper_editAreaPoint'||edObj.operStatus=='oper_insertAreaPoint'){
		mapPolygon.editPoint.show();//显示编辑点
	}else{
		mapPolygon.editPoint.hide();//隐藏编辑点
	}*/
	if(edObj.operStatus=='oper_click'){
		mapPolygon.areaScale.show();//显示缩放框
		mapPolygon.editPoint.show();//显示编辑点
		mapPolygon.areaRot.show();//隐藏旋转点
	}else{
		mapPolygon.areaScale.hide();//隐藏缩放框
		mapPolygon.editPoint.hide();//隐藏编辑点
		mapPolygon.areaRot.hide();//隐藏旋转点
	}
	
	//离开分割区域时的清理工作
	if(edObj.operStatus!='oper_clip'){
		mapPolygon.clip.clear();
	}
	//离开合并区域时的清理工作
	if(edObj.operStatus!='oper_polygon'){
		mapPolygon.merge.clear();
	}
	//元素旋转
	if(edObj.operStatus=='oper_rotEle'){
		mapPolygon.rotNodes.paintRotRect();//加载旋转外框
	}else{
		mapPolygon.rotNodes.remove();//移除旋转外框
	}
}
//左侧控制面板事件
function operEvents(){
	//操作状态切换
	$('input[name="operStatus"]').on('change',function(){
		var selEle=$('input[name="operStatus"]:checked');
		edObj.operStatus=selEle.val();
		$('input[name="operStatus"]').siblings('.operSub').hide();
		$('.operSub').hide();
		if($('.operSub.'+edObj.operStatus).length>0){
			$('.operSub.'+edObj.operStatus).show();
			$('.myDialog.oper').width(180);
		}else{
			$('.myDialog.oper').width(54);
		}
		
		operStatusChange();
	});
	//画板输入旋转
	$('#rotBg_angle').on('change',function(){
		if(!edObj.mapBg){
			return;
		}
		var angel=parseFloat($(this).val())/57.29577951308233;
		if(typeof angel=='number'&&angel==angel){
		    edObj.mapBg.rotation=angel;
		    $(this).val('');
		}
	});
	//元素输入旋转
	$('#rotEle_angle').on('change',function(){
		if(edObj.curNode.length<1){
			return;
		}
		var angel=parseFloat($(this).val())/57.29577951308233;
		if(typeof angel=='number'&&angel==angel){
			/*if(edObj.curNode.length==1){
				edObj.curNode[0].rotation=angel;
			    mapPolygon.updatePolygonPos('rot',edObj.curNode[0]);//更新位置数据
			}else{
				//mapPolygon.repaintRect
				
			}*/
			mapPolygon.rotNodes.doRot(edObj.curNode,angel);
			$(this).val('');
		    //mapHistory.appendHistory({
			//	name:'旋转'
			//});
		}
	});
	/*//状态切换
	$('input[name="status"]').on('change',function(){
		var selEle=$('input[name="status"]:checked');
		edObj.status.value=selEle.val();
		//附属UI的隐藏/显示
		$('input[name="status"]').each(function(){
			if(this===selEle.get(0)){
				if($(this).siblings('.operBtns').length>0){
					$(this).siblings('.operBtns').show();
				}
			}else{
				if($(this).siblings('.operBtns').length>0){
					$(this).siblings('.operBtns').hide();
				}
			}
		});
		if(edObj.curNode.length>0){
			if($(this).val()=='editEle'){
				//编辑点显示
				mapPolygon.editPoint.show();//显示编辑点
				var editStatus=$('input[name="editStatus"]:checked').val();
				if(editStatus=='editStatus_scale'){
					mapPolygon.areaScale.show();//显示缩放框
				}
			}else{
				mapPolygon.editPoint.hide();//隐藏编辑点
				mapPolygon.areaScale.hide();//隐藏缩放框
			}
		}
		//离开绘制多边形时的清理工作
		if(edObj.status.value!='printPolygon'){
			mapPolygon.print.clear();
		}
		//离开编辑元素时的清理工作
		if(edObj.status.value!='editEle'){
			mapPolygon.clip.clear();
		}
		//路径显示/隐藏
		if(edObj.status.value=='editPath'&&!mapPath.visible){
			mapPath.show();
		}else{
			mapPath.hide();
		}
	});
	//编辑状态的子状态改变事件
	$('input[name="editStatus"]').on('change',function(){
		var selEle=$('input[name="editStatus"]:checked');
		var status=selEle.val();
		//离开分割区域时的清理工作
		if(status!='editStatus_clip'){
			mapPolygon.clip.clear();
		}
		if(status=='editStatus_scale'){
			mapPolygon.areaScale.show();//显示缩放框
		}else{
			mapPolygon.areaScale.hide();//隐藏缩放框
		}
	});
	//子元素输入旋转
	$('#rotEle_angle').on('change',function(){
		if(edObj.curNode.length<1){
			return;
		}
		var angel=parseFloat($(this).val());
		if(typeof angel=='number'&&angel==angel){
		    edObj.curNode.forEach(function(node){
		    	node.rotation=angel;
		    	mapPolygon.updatePolygonPos('rot',node);//更新位置数据
		    });
		    
		    $(this).val('');
		}
	});
	//画板输入旋转
	$('#rotBg_angle').on('change',function(){
		if(!edObj.mapBg){
			return;
		}
		var angel=parseFloat($(this).val());
		if(typeof angel=='number'&&angel==angel){
		    edObj.mapBg.rotation=angel;
		    $(this).val('');
		}
	});
	//编辑操作切换
	$('input[name="editStatus"]').on('change',function(){
		var selEle=$('input[name="editStatus"]:checked');
		$('input[name="editStatus"]').each(function(){
			var operDiv=$(this).next().next().next();
			if(this===selEle.get(0)){
				if(operDiv.length>0){
					operDiv.show();
				}
			}else{
				if(operDiv.length>0){
					operDiv.hide();
				}
			}
		});
	})
	//编辑颜色确定
	$('#editEleClr_ok').on('click',function(){
		if(edObj.curNode.length<1){
			return;
		}
		var color='0x'+$('#editEleClr_box').val();
		edObj.curNode.forEach(function(node){
			mapPolygon.repaintRect(node,node.mapData.posData.points,color);
		});
		mapHistory.appendHistory('变色');
	})
	//编辑标签确定
	$('#editEleTxt_ok').on('click',function(){
		if(edObj.curNode.length<1){
			return;
		}
		var size=parseInt($('#editEleTxt_size').val());
		var txt=$('#editEleTxt_box').val();
		var txtStyle={
			fontSize: size
		};
		edObj.curNode.forEach(function(node){
			mapPolygon.addText(node,txt,txtStyle);
		});
	})
	//编辑logo确定
	$('#editEleLogo_ok').on('click',function(){
		if(edObj.curNode.length<1){
			return;
		}
		var obj={};
		var img=$('input[name="editEleLogoImage"]:checked').parent().find('img');
		obj.url=img.attr('src');
		obj.posType=$('input[name="editEleLogoPos"]:checked').val();
		obj.align=$('input[name="editEleLogoAlign"]:checked').val();
		obj.x=parseInt($('#editEleLogo_x').val());
		obj.y=parseInt($('#editEleLogo_y').val());
		obj.w=parseInt($('#editEleLogo_w').val())||img.width();
		obj.h=parseInt($('#editEleLogo_h').val())||img.height();
		edObj.curNode.forEach(function(node){
			mapPolygon.addLogo(node,obj);
		});
	})
	//编辑logo位置切换
	$('input[name="editEleLogoPos"]').on('change',function(){
		var alignDiv=$('#editEleLogoPosAlignDiv'),
			tempDiv=$('#editEleLogoPosTempDiv');
		var value=$('input[name="editEleLogoPos"]:checked').val();
		if(value=='align'){
			alignDiv.show();
			tempDiv.hide();
		}else{
			alignDiv.hide();
			tempDiv.show();
		}
	});
	
	//模板拖拽开始
	$('.mouldList li').each(function(index,ele){
		ele.ondragstart = function(e){ //开始拖动源对象
			var mouldName=$(this).attr('data-mouldname');
			e.dataTransfer.setData('mouldData',JSON.stringify(mapMoulde.data[mouldName]));
		}
	});
	//模板状态切换
	$('input[name="mouldStatus"]').on('change',function(){
		$('input[name="mouldStatus"]').next().next().next().hide();
		$(this).next().next().next().show();
	});
	//绘制路径状态切换
	$('input[name="editPath_status"]').on('change',function(){
		$('input[name="editPath_status"]').next().next().next().hide();
		var selEle=$('input[name="editPath_status"]:checked');
		selEle.next().next().next().show();
		var status=selEle.val();
		if(selEle!='createPathPoint'){
			mapPath.clearTemp();
		}
		if(selEle!='addPathPoint'){
			mapPath.clearAddTemp();
		}
	});
	//尺标显示隐藏
	$('#showRuler').on('change',function(){
		if($(this).prop('checked')){
			mapRuler.show();
			mapRuler.change();
		}else{
			mapRuler.hide();
		}
	});*/
}
//退出临时状态
function setTempStatusVisible(bVisible,status){
	var tempStatus=$('.operTempBg');
	if(bVisible){
		if($('oper_'+status).length>0){
			$('oper_'+status).prop('checked',true);
		}else{
			edObj.operStatus='oper_'+status;
			tempStatus.show();
		}
		tempStatus.find('button[data-type="oper_'+status+'"]').show();
	}else{
		edObj.operStatus=$('input[name="operStatus"]:checked').val();
		tempStatus.hide();
		tempStatus.find('button[data-type]').hide();
	}
	
	operStatusChange();
}
//画板初始化  
function mapBgInit(){
	var pixiBg=$('.pixiBg');
	var app = new PIXI.Application(pixiBg.width(), pixiBg.height(), {backgroundColor : 0x1099bb,antialias:true});
	pixiBg.get(0).appendChild(app.view);
	
	var bg = mapBg.init();
	bg.x=pixiBg.width()/2;
	bg.y=pixiBg.height()/2;

	app.stage.addChild(bg);
	
	edObj.app=app;
	edObj.mapBg=bg;
	edObj.mapEle=pixiBg;
}

//画板事件
function mapBgEvents(){
	//尺寸变化
	$(window).on('resize',function(){
		var w=$(this).width();
		var h=$(this).height();
		if(edObj.app){
			edObj.app.renderer.resize(w,h);
		}
	});
	//右键菜单
	$('body').on('click',function(){
		$('.rightMenu').hide();
	});
	edObj.mapEle.on('contextmenu',function(e){
		//取消默认浏览器右键菜单
		e.preventDefault();
		if(edObj.operStatus=='oper_path'){
			return;
		}
		var x=e.pageX,
			y=e.pageY,
			menu=$('.rightMenu'),
			list=menu.find('.rightMenuList'),
			isAnyOper=false;
		list.find('li').hide();
		
		//是否有选中区域   判定复制、剪切、编辑点位、插入点位、缩放区域、分割、存为模板
		if(edObj.curNode.length>0){
			isAnyOper=true;
			list.find('li[data-oper="copy"],li[data-oper="cut"],li[data-oper="clip"],li[data-oper="saveMould"]').show();
		}
		
		//判定是否可合并
		if(mapPolygon.merge.getMergeNodes()){
			isAnyOper=true;
			list.find('li[data-oper="merge"]').show();
		}
		
		//粘贴判定
		if(JSON.stringify(edObj.copyData)!='{}'){
			isAnyOper=true;
			var pasteLi=list.find('li[data-oper="paste"]');
			pasteLi.show();
			pasteLi.attr('data-x',e.pageX);
			pasteLi.attr('data-y',e.pageY);
		}
		
		//连接、取消连接路径点
		if((mapPath.selPt.length+edObj.curNode.length)>1){
			isAnyOper=true;
			list.find('li[data-oper="unLinkPoint"],li[data-oper="linkPoint"]').show();
		}
		//连接、取消连接路径点 end
		
		
		if(isAnyOper){
			menu.css({
				'top':y+'px',
				'left':x+'px'
			});
			menu.show();
		}
	});
	$('.rightMenuList li').on('click',function(e){
		var oper=$(this).attr('data-oper');
		if(oper=='copy'){//复制
			mapPolygon.copy(false);
		}
		if(oper=='cut'){//剪切
			mapPolygon.copy(true);
		}
		if(oper=='linkPoint'){//连接路径
			mapPath.linkPoints(true);
		}
		if(oper=='unLinkPoint'){//取消路径连接
			mapPath.linkPoints(false);
		}
		if(oper=='clip'){//分割
			setTempStatusVisible(true,oper);
		}
		if(oper=='merge'){//合并
			setTempStatusVisible(true,oper);
			//mapPolygon.merge.doMerge();
		}
		if(oper=='saveMould'){
			showSaveMouldDlg({
				callback:function(name){
					mapMoulde.appendData(name);
				}
			})
		}
		if(oper=='paste'){//粘贴
			mapPolygon.paste({
				x:$(this).attr('data-x'),
				y:$(this).attr('data-y')
			});
		}
	});
	//右键菜单 end
	//鼠标滚轮缩放
	edObj.mapEle.bind('mousewheel DOMMouseScroll',  function (e) {
	    //判断鼠标滚动方向，上为正数，下为负数
		var whd = e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : e.originalEvent.detail;
		var dir = whd > 0 ? 1 : 0;
		if(dir){
			mapBg.toBig();
		}else{
			mapBg.toSmall();
		}
	    /*var delta = event.originalEvent.wheelDelta||;
	    console.log(event.originalEvent.wheelDelta);
	    if (delta > 0) {
	    	mapBg.toBig();
	    } else {
	    	mapBg.toSmall();
	    }*/
	});
	//鼠标滚轮缩放 end
	
	//模板拖拽接收
	edObj.mapEle.get(0).ondragover=function(e){//拖放中
    	e.preventDefault();//阻止默认行为，使得drop可以触发
    };
    edObj.mapEle.get(0).ondrop=function(e){//拖动结束
		console.log('drop',e,e.dataTransfer.getData('mouldData'));
		var mouldData=e.dataTransfer.getData('mouldData');
		if(!mouldData){
			return;
		}
		mouldData=JSON.parse(mouldData);
		var mousePos={
			x:e.pageX,
			y:e.pageY
		};
		var mapPos=mapMath.getMapPointInAppPos(mousePos);
		mapMoulde.append(mouldData,mapPos);
    };
    //模板拖拽接收 end

	//根窗口鼠标事件
	edObj.mapEle.on('mousedown',function(e){
		//旋转
    	if (!this.rotationing) {
    		if(edObj.operStatus=='oper_rotBg'){
    			rotStart(this,e,edObj.mapBg);
    		}
    		if(edObj.operStatus=='oper_rotEle'){
    			var rotRect=edObj.mapBg.children.filter(function(item){
					return item.areaChildType=='rotNodes';
				})[0];
				if(rotRect){
					rotStart(this,e,rotRect);
				}
    		}
    		/*if(edObj.operStatus=='rotEle'){
    			var that=this;
    			edObj.curNode.forEach(function(node){
    				rotStart(that,e,node);
    			});
    		}*/
	    }
    	//框选或绘制矩形
    	if(!this.boxing&&(edObj.operStatus=='oper_range'||edObj.operStatus=='oper_rect')){
    		mapBoxSel.start(this,e);
    	}
	});
	edObj.mapEle.on('mousemove',function(e){
		//旋转
    	if (this.rotationing) {
    		if(edObj.operStatus=='oper_rotBg'){
    			rotMove(this,e,edObj.mapBg);
    		}
    		if(edObj.operStatus=='oper_rotEle'){
    			var rotRect=edObj.mapBg.children.filter(function(item){
					return item.areaChildType=='rotNodes';
				})[0];
				if(rotRect){
					rotMove(this,e,rotRect);
				}
    		}
    		/*if(edObj.operStatus=='rotEle'){
    			var that=this;
    			edObj.curNode.forEach(function(node){
    				rotMove(that,e,node);
    			});
    		}*/
	    }
    	//框选或绘制矩形
    	if(this.boxing&&(edObj.operStatus=='oper_range'||edObj.operStatus=='oper_rect')){
    		mapBoxSel.move(this,e);
    	}
	});
	edObj.mapEle.on('mouseup',function(e){
		//旋转
    	if (this.rotationing) {
    		if(edObj.operStatus=='oper_rotBg'){
    			rotEnd(this,e,edObj.mapBg);
    		}
    		if(edObj.operStatus=='oper_rotEle'){
    			var rotRect=edObj.mapBg.children.filter(function(item){
					return item.areaChildType=='rotNodes';
				})[0];
				if(rotRect){
					rotEnd(this,e,rotRect,function(node){
						mapPolygon.rotNodes.doRot(edObj.curNode,node.rotation);
					});
					//mapHistory.appendHistory({
					//	name:'旋转'
					//});
				}
    		}
    		/*if(edObj.operStatus=='rotEle'){
    			var that=this;
    			edObj.curNode.forEach(function(node){
    				rotEnd(that,e,node,function(node){
	    				mapPolygon.updatePolygonPos('rot',node);//更新位置数据
	    			});
    			});
    			mapHistory.appendHistory('旋转');
    		}*/
	    }
    	//框选和绘制矩形
    	if(this.boxing){
    		//框选
    		if(edObj.operStatus=='oper_range'){
    			mapBoxSel.end(this,e,function(rc){
	    			var sels=mapBoxSel.getSelectNodes(rc);
					mapBoxSel.doSelect(sels);
	    		});
    		}
    		//绘制矩形
    		if(edObj.operStatus=='oper_rect'){
    			mapBoxSel.end(this,e,function(rc){
    				if(!mapServerData.data.FloorID){
						showToast({
							title:'请选择楼层'
						});
						return;
					}
	    			var points=[
	    				{x:rc.left,y:rc.top},
	    				{x:rc.right,y:rc.top},
	    				{x:rc.right,y:rc.bottom},
	    				{x:rc.left,y:rc.bottom},
	    			];
	    			//最小宽高限制
	    			if(Math.abs(rc.left-rc.right)<20||Math.abs(rc.top-rc.bottom)<20){
	    				return;
	    			}
	    			var node=mapPolygon.append({
						points:points,
						color:mapPolygon.myStyle.fillColor,
					});
					var server=[];
					server.push({
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',node)
					})
					var local=[];
					local.push({
						type:'add',
						data:JSON.stringify(node.mapData),
					})
					mapHistory.appendHistory({
						name:'绘制矩形',
						server:server,
						local:local
					});
					/*mapServerData.changeServer({//上传服务器数据
						type:'addArea',
						data:mapServerData.getDataFromNode('addArea',node)
					});*/
	    		});
    		}
    	}
	});
	//根窗口鼠标事件 end
	
	mapBg.bindEvent();//背景板事件
}

//拖拽开始
function dragStart(e,context,callback){
	context.data = e.data;
    context.dragging = true;

    context.dragPoint = e.data.getLocalPosition(context.parent);
    context.dragPoint.x -= context.x;
    context.dragPoint.y -= context.y;
    context.startPi={};
    context.startPi.x = context.x;
    context.startPi.y = context.y;
    if(callback&&typeof callback=='function'){
		callback(context);
	}
}
//拖拽
function dragMove(e,context,callback){
	var newPosition = context.data.getLocalPosition(context.parent);
	
	var noX=false,//限制x
		noY=false;//限制y
	var nodeType=context.areaChildType;
	if(nodeType&&nodeType.indexOf('scalePoint')!=-1){
		if(nodeType.split('_')[1]=='top'||nodeType.split('_')[1]=='bottom'){
			noX=true;
		}
		if(nodeType.split('_')[1]=='left'||nodeType.split('_')[1]=='right'){
			noY=true;
		}
	}
	
	if(!noX){
		context.x = newPosition.x - context.dragPoint.x;
	}
    if(!noY){
    	context.y = newPosition.y - context.dragPoint.y;
    }
    if(callback&&typeof callback=='function'){
		callback(context);
	}
}
//拖拽结束
function dragEnd(e,context,callback){
	var isDoDrag=false;
	if(Math.abs(context.x-context.startPi.x)>0.9||Math.abs(context.y-context.startPi.y)>0.9){
		isDoDrag=true;
	}
    context.startPi.y = context.y;
	context.dragging = false;
	context.data = null;
	context.startPi = null;
	
	if(isDoDrag&&callback&&typeof callback=='function'){
		callback(context,e);
	}
}
//旋转开始
function rotStart(root,e,target,callback){
	if(edObj.operStatus=='rotEle'&&!edObj.curNode){
		return;
	}
	var e = event || window.event;
	var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
    var x = e.pageX || e.clientX + scrollX;
	root.rotationing=true;
	root.rotStartX=x;
	root.rotStartRot=target.rotation;
	if(callback&&typeof callback=='function'){
		callback(context);
	}
}
//旋转
function rotMove(root,e,target,callback){
	if(edObj.operStatus=='rotEle'&&!edObj.curNode){
		return;
	}
	var e = event || window.event;
	var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
    var newPos = e.pageX || e.clientX + scrollX;
    var xDif=root.rotStartX-newPos;
    target.rotation=root.rotStartRot+xDif*0.01;
    if(callback&&typeof callback=='function'){
		callback(target);
	}
}
//旋转结束
function rotEnd(root,e,target,callback){
	if(edObj.operStatus=='rotEle'&&!edObj.curNode){
		return;
	}
	root.rotationing = false;
	root.rotStartX = null;
	root.rotStartRot=null;
	if(callback&&typeof callback=='function'){
		callback(target);
	}
}

//导出地图数据
function exportMapData(){
	if(!edObj.mapBg||edObj.mapBg.children.length<1){
		alert('无地图数据');
		return;
	}
	var fileName=$('#exportFileName').val()?$('#exportFileName').val():'mapData'+new Date().valueOf();
	var exportType=$('input[name="exportType"]:checked').val();
	if(exportType=='exportTxt'){//导出txt
		var temp=mapHistory.getMapData();
		var blob = new Blob([JSON.stringify(temp)], { type: "text/plain;charset=utf-8" });
		FileSaver.saveAs(blob, fileName+".txt");
	}
	if(exportType=='exportSvg'){//导出svg
		console.log(mapHistory.getMapData());
		var temp=mapHistory.getMapData();
		var svgHtml='<?xml version="1.0" encoding="utf-8"?>';
		svgHtml+='<svg version="1.1" id="" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 '
		+edObj.width+' '+edObj.height+'" enable-background="new 0 0 '+edObj.width+' '+edObj.height+'" xml:space="preserve">';
		if(temp.polygons){
			for(var i=0;i<temp.polygons.length;i++){
				var color=temp.polygons[i].color;
				var points=temp.polygons[i].points.replace(/\|/g,' ');
				svgHtml+='<polygon fill="'+color+'" points="'+points+'"';
				var label=temp.polygons[i].label;
				if(temp.polygons[i].label){
					svgHtml+=' areaname="'+label.txt+'" fontsize="'+label.fontSize+'" fontx="'+label.x+'" fonty="'+label.y+'"';
				}
				svgHtml+='/>';
			}
		}
		if(temp.paths){
			for(var i=0;i<temp.paths.length;i++){
				var uid=temp.paths[i].uid;
				var links=temp.paths[i].links.split('|').map(function(item){
					var linkData=item.split('_');
					return {
						x:linkData[0],
						y:linkData[1],
						uid:linkData[2]
					};
				});
				svgHtml+='<circle uid="'+temp.paths[i].uid+'" links="'+links.map(function(item){return item.uid}).join('|')+'" cx="'+temp.paths[i].x+'" cy="'+temp.paths[i].y+'" r="10" stroke="#000000" stroke-width="2" fill="transparent" />';
				for(var j=0;j<links.length;j++){
					svgHtml+='<line x1="'+temp.paths[i].x+'" y1="'+temp.paths[i].y+'" x2="'+links[j].x+'" y2="'+links[j].y+'" style="stroke:#ffff00;stroke-width:1"/>';
				}
			}
		}
		svgHtml+='</svg>';
		var blob = new Blob([svgHtml], { type: "text/plain;charset=utf-8" });
		FileSaver.saveAs(blob, fileName+".svg");
	}
}
//导入地图数据
function importMapData(file){
    var selectedFile = file.files[0];//获取读取的File对象
    if(!selectedFile){
    	return;
    }
    var name = selectedFile.name;//文件名
    var size = selectedFile.size;//文件的大小

    var reader = new FileReader();
    reader.readAsText(selectedFile);

    reader.onload = function(){
    	var data=this.result;
    	if(name.indexOf('.svg')!=-1){//svg文件
    		var temp={};;
    		data=$(data);
    		if(data.find('polygon').length>0){
    			var polygons=[];
	    		data.find('polygon').each(function(index,item){
	    			var obj={
	    				color:$(item).attr('fill').replace('#','0x'),
						points:$(item).attr('points').split(' ').filter(function(point){
							return point!=""&&point.split(',').length==2;
						}).map(function(point){
							return {
								x:parseInt(point.split(',')[0]),
								y:parseInt(point.split(',')[1])
							}
						}),
						uid:$(item).attr('uid')
	    			};
	    			if($(item).attr('areaname')){
	    				obj.label={
							txt:$(item).attr('areaname'),
							fontSize:parseInt($(item).attr('fontsize')),
							x:parseInt($(item).attr('fontx')),
							y:parseInt($(item).attr('fonty')),
							color:$(item).attr('fontcolor'),
							fontWeight:$(item).attr('fontweight'),
							fontStyle:$(item).attr('fontstyle'),
						}
	    			}
	    			if($(item).attr('pathx')){
						obj.path={
							x:parseInt($(item).attr('pathx')),
							y:parseInt($(item).attr('pathy')),
						};
						if($(item).attr('pathlinks')){
							obj.path.links=$(item).attr('pathlinks').split('|').map(function(str){
								return ''+str;
							}).filter(function(str){
								return (str!=''&&str!='undefined'&&str!='null'&&str!=undefined&&str!=null);
							});
						}else{
							obj.path.links=[];
						}
					}
	    			if($(item).attr('logourl')){
	    				obj.logo={
							url:$(item).attr('logourl'),
							x:parseInt($(item).attr('logox')),
							y:parseInt($(item).attr('logoy')),
							scale:parseInt($(item).attr('logoscale'))
						}
	    			}
	    			polygons.push(obj);
	    		});
	    		temp.polygons=polygons;
    		}
    		
    		/*if(data.find('path').length>0){
    			var curves=[];
	    		data.find('path').each(function(index,item){
	    			var obj={
	    				color:$(item).attr('fill').replace('#','0x'),
						points:$(item).attr('d').replace(/M|z/g,'').split(/C|L/).filter(function(point){
							return point!=="";
						}).map(function(point){
							if(point.indexOf(' ')!=-1){
								var pts=point.split(' ');
								return {
									type:'curve',
									x:parseInt(pts[2].split(',')[0]),
									y:parseInt(pts[2].split(',')[1]),
									cp1:{
										x:parseInt(pts[0].split(',')[0]),
										y:parseInt(pts[0].split(',')[1]),
									},
									cp2:{
										x:parseInt(pts[1].split(',')[0]),
										y:parseInt(pts[1].split(',')[1]),
									}
								}
							}else{
								return {
									type:'normal',
									x:parseInt(point.split(',')[0]),
									y:parseInt(point.split(',')[1])
								}
							}
						})
	    			};
	    			if($(item).attr('areaname')){
	    				obj.label={
							txt:$(item).attr('areaname'),
							fontSize:parseInt($(item).attr('fontsize')),
							x:parseInt($(item).attr('fontx')),
							y:parseInt($(item).attr('fonty')),
						}
	    			}
	    			if($(item).attr('logourl')){
	    				obj.logo={
							url:$(item).attr('logourl'),
							x:parseInt($(item).attr('logox')),
							y:parseInt($(item).attr('logoy')),
							scale:parseInt($(item).attr('logoscale'))
						}
	    			}
	    			curves.push(obj);
	    		});
	    		temp.curves=curves;
    		}*/
    		
    		if(data.find('circle[uid][links]').length>0){
    			var paths=[];
	    		data.find('circle[uid][links]').each(function(index,item){
	    			paths.push({
						x:parseInt($(item).attr('cx')),
						y:parseInt($(item).attr('cy')),
						uid:parseInt($(item).attr('uid')),
						links:$(item).attr('links').split('|').map(function(str){
							return ''+str;
						}).filter(function(str){
							return str!=''&&str!='undefined'&&str!='null'&&str!=undefined&&str!=null;
						})
					});
	    		});
	    		temp.paths=paths;
    		}
    		
    		rePaintMap(temp);
    	}else if(name.indexOf('.txt')!=-1){//txt文件
    		var temp={};
    		data=JSON.parse(data);
    		//多边形
    		if(data.polygons&&data.polygons.length>0){
    			var polygons=[];
				data.polygons.forEach(function(item){
					var obj={
						color:item.color.replace('#','0x'),
						points:item.points.split('|').map(function(point){
							return {
								x:parseInt(point.split(',')[0]),
								y:parseInt(point.split(',')[1])
							}
						}),
						areaId:item.areaId
					};
					if(item.path){
						obj.path=item.path;
						if(item.path.links){
							obj.path.links=item.path.links.split('|').map(function(str){
								return ''+str;
							}).filter(function(str){
								return str!=''&&str!='undefined'&&str!='null'&&str!=undefined&&str!=null;
							});
						}else{
							obj.path.links=[];
						}
					}
					if(item.label){
	    				obj.label=item.label;
	    			}
					if(item.logo){
	    				obj.logo=item.logo;
	    			}
					polygons.push(obj);
				});
				temp.polygons=polygons;
    		}
			//多边形 end
			//弧线多边形
			/*if(data.curves&&data.curves.length>0){
				var curves=[];
				data.curves.forEach(function(item){
					var obj={
						color:item.color.replace('#','0x'),
						points:item.points.split('|').map(function(point){
							if(point.indexOf(' ')!=-1){
								var pts=point.split(' ');
								return {
									type:'curve',
									x:parseInt(pts[2].split(',')[0]),
									y:parseInt(pts[2].split(',')[1]),
									cp1:{
										x:parseInt(pts[0].split(',')[0]),
										y:parseInt(pts[0].split(',')[1]),
									},
									cp2:{
										x:parseInt(pts[1].split(',')[0]),
										y:parseInt(pts[1].split(',')[1]),
									}
								}
							}else{
								return {
									type:'normal',
									x:parseInt(point.split(',')[0]),
									y:parseInt(point.split(',')[1])
								}
							}
						})
					};
					if(item.label){
						obj.label=item.label;
					}
					if(item.logo){
						obj.logo=item.logo;
					}
					curves.push(obj);
				});
				temp.curves=curves;
			}*/
			//弧线多边形 end
			//路径
			if(data.paths&&data.paths.length>0){
				var paths=[];
				data.paths.forEach(function(item){
					paths.push({
						x:item.x,
						y:item.y,
						PointID:item.PointID,
						links:item.links.split('|').map(function(str){
							return ''+str;
						}).filter(function(str){
							return str!=''&&str!='undefined'&&str!='null'&&str!=undefined&&str!=null;
						})
					});
				});
				temp.paths=paths;
			}
			//路径 end
    		rePaintMap(temp);
    	}
    	$(file).val('');
    };
}

//弹出提示 obj.title提示文本 obj.duration关闭时间
function showToast(obj){
	if($(".myToast").length>0){return;}
	var title=obj.title;
	var duration=obj.duration||1000;
	
	var toastHtml='<div class="myToast">'+title+'</div>';
	$('body').append($(toastHtml));
	setTimeout(function(){
		$(".myToast").animate({
			opacity:'0',
		},'fast').remove();
	},duration);
}
/*选择提示框  
 * obj.title提示文本
 * obj.btns 按钮数组 默认为["确定","取消"]
 * obj.callback回调函数返回 按钮序列号
 */
function showConfirm(obj){
	if($('.myConfirmDlg').length>0){
		return;
	}
	var btns=obj.btns||["确定","取消"];
	var doHtml='<div class="dlgBg"></div>'
		+'<div class="myConfirmDlg">'
			+'<div class="txtBg">'
				+'<div class="txt">'+obj.title+'</div>'
			+'</div>'
			+'<div class="btnBg">';
	for(var i=0;i<btns.length;i++){
		doHtml+='<button class="btn">'+btns[i]+'</button>';
	}
	doHtml+='</div></div>';
	$('body').append($(doHtml));
	$('.myConfirmDlg .btn').on('click',function(){
		if(typeof obj.callback=='function'){
			obj.callback($('.myConfirmDlg .btn').index($(this)));
		}
		$('.dlgBg').remove();
		$('.myConfirmDlg').remove();
	});
}
/*选择提示框  
 * obj.callback回调函数 返回 模板名称
 */
function showSaveMouldDlg(obj){
	var saveHtml='<div><input class="mouldName" placeholder="输入模板名称" /></div><div><button class="mouldSave">保存</button></div>'
	var dlg=createDialog({
		title:"保存模板",
		className:'saveMould',
		width:400,
		height:300,
		contentHtml:saveHtml,
		onClose:function(){}
	});
	
	dlg.find('button').on('click',function(){
		var mName=dlg.find('.mouldName').val();
		if(!mName){
			showToast({
				title:"请输入模板名称"
			});
			return;
		}
		if(typeof obj.callback=='function'){
			obj.callback(mName);
		}
		dlg.find('.close').trigger('click');
	});
}
/*拖动条  
 * obj.ele父元素的jQuery对象
 * obj.callback回调函数返回数值
 */
var mySilder={
	init:function(obj){
		var pt=obj.ele.find('.point');
		var bgWidth=obj.ele.find('.bg').width();
		var txt=obj.ele.find('.txt');
		pt.on('mousedown',function(e){
			eleDrag({
				toDrag:this,
				event:e,
				moving:function(point){
			    	point.style.top='-4px';
			    	var left=parseInt(point.style.left);
			    	if(left<-6){
			    		point.style.left='-6px';
			    	}
			    	if(left>bgWidth-6){
			    		point.style.left=(bgWidth-6)+'px';
			    	}
				},
				moved:function(point){
					var num=(parseInt(point.style.left)+6)/bgWidth;
					num=num.toFixed(1);
					txt.html(num);
					if(typeof obj.callback=='function'){
						obj.callback(num);
					}
				},
			})
		    //eleDrag(this,e,);
		});
	},
	setValue:function(ele,num){
		var pt=ele.find('.point');
		var bgWidth=ele.find('.bg').width();
		var txt=ele.find('.txt');
		txt.html(num);
		pt.css('left',(num*bgWidth)-6+'px');
	},
	getValue:function(ele){
		var pt=ele.find('.point');
		var bgWidth=ele.find('.bg').width();
		var num=(parseInt(pt.css('left'))+6)/bgWidth;
		return num;
	}
}
function getScrollOffsets(w) {
    w = w || window;
    
    if (w.pageXOffset != null) return {x: w.pageXOffset, y:w.pageYOffset};

    var d = w.document;
    if (document.compatMode == "CSS1Compat")
        return {x:d.documentElement.scrollLeft, y:d.documentElement.scrollTop};

    return { x: d.body.scrollLeft, y: d.body.scrollTop };
}
/* 拖拽事件
 * obj.toDrag拖动影响的元素
 * obj.event源事件
 * obj.moving拖动中的回调函数
 * obj.moved拖动结束的回调函数
 */
function eleDrag(obj) {
    var scroll = getScrollOffsets();

	var startX = obj.event.clientX + scroll.x;
	var origX = obj.toDrag.offsetLeft;
	var deltaX = startX - origX;

	var startY = obj.event.clientY + scroll.y;
    var origY = obj.toDrag.offsetTop;
    var deltaY = startY - origY;
    

    if (document.addEventListener) {  // Standard event model
        document.addEventListener("mousemove", moveHandler, true);
        document.addEventListener("mouseup", upHandler, true);
    }
    else if (document.attachEvent) {  // IE Event Model for IE5-8
        obj.toDrag.setCapture();
        obj.toDrag.attachEvent("onmousemove", moveHandler);
        obj.toDrag.attachEvent("onmouseup", upHandler);
        obj.toDrag.attachEvent("onlosecapture", upHandler);
    }

    if (obj.event.stopPropagation) obj.event.stopPropagation();  // Standard model
    else obj.event.cancelBubble = true;                      // IE

    // Now prevent any default action.
    if (obj.event.preventDefault) obj.event.preventDefault();   // Standard model
    else obj.event.returnValue = false;                     // IE

    function moveHandler(e) {
        if (!e) e = window.event;  // IE event Model

        var scroll = getScrollOffsets();
        obj.toDrag.style.left = (e.clientX + scroll.x - deltaX) + "px";
        obj.toDrag.style.top = (e.clientY + scroll.y - deltaY) + "px";

        if (e.stopPropagation) e.stopPropagation();  // Standard
        else e.cancelBubble = true;                  // IE
        
        if(typeof obj.moving=='function'){
	    	obj.moving(obj.toDrag)
	    }
    }

    function upHandler(e) {
        if (!e) e = window.event;  // IE Event Model

        if (document.removeEventListener) {  // DOM event model
            document.removeEventListener("mouseup", upHandler, true);
            document.removeEventListener("mousemove", moveHandler, true);
        }
        else if (document.detachEvent) {  // IE 5+ Event Model
            obj.toDrag.detachEvent("onlosecapture", upHandler);
            obj.toDrag.detachEvent("onmouseup", upHandler);
            obj.toDrag.detachEvent("onmousemove", moveHandler);
            obj.toDrag.releaseCapture();
        }

        if (e.stopPropagation) e.stopPropagation();  // Standard model
        else e.cancelBubble = true;                  // IE
        
        if(typeof obj.moved=='function'){
	    	obj.moved(obj.toDrag)
	    }
    }
}
/*创建公用弹窗
 * obj.title 标题
 * obj.className 弹窗class标志
 * obj.width 宽度
 * obj.height 高度
 * obj.contentHtml 主体页面HTML
 * obj.onClose 关闭事件回调
 */
function createDialog(obj){
	var title=obj.title||'',
		className=obj.className||newDate().valueOf(),
		width=obj.width||500,
		height=obj.height||300,
		top=($('body').height()-height)/2,
		left=($('body').width()-width)/2,
		contentHtml=obj.contentHtml||'';
	var doHtml='<div class="dlgBg '+className+'"></div>'+
	'<div class="myDialog '+className+'" style="width:'+width+'px;height:'+height+'px;top:'+top+'px;left:'+left+'px;">'+
		'<div class="topBg">'+
			'<div class="title">'+title+'</div>'+
			'<div class="close"></div>'+
		'</div>'+
		'<div class="content" style="height:'+(height-33)+'px">'+contentHtml+'</div>'+
	'</div>';
	$('body').append($(doHtml));
	$('.myDialog.'+className+' .close').on('click',function(){
		$('.dlgBg.'+className).remove();
		$('.myDialog.'+className).remove();
		if(typeof obj.onClose=='function'){
			obj.onClose();
		}
	});
	$('.myDialog.'+className+' .topBg').on('mousedown',function(e){
		eleDrag({
			toDrag:$('.myDialog.'+className).get(0),
			event:e
		});
	});
	return $('.myDialog.'+className);
}
/*鼠标样式修改
 * 'normal'默认 'move'手型移动
 */
function setMouseStyle(type){
	var normal="inherit",
		normal_click="pointer",
		move="url('images/cursor/hand.png'),auto",
		move_click="url('images/cursor/hand2.png'),auto";
	var styleObj=edObj.app.renderer.plugins.interaction.cursorStyles;

	if(type=='normal'){
		styleObj.default=normal;
		styleObj.pointer=normal_click;
	}
	if(type=='move'){
		styleObj.default=move;
		styleObj.pointer=move_click;
	}
}
//元素对齐
var mapAlign={
	getRect:function(){
		if(edObj.curNode.length<1){
			return null;
		}
		var ary=[];
		for(var i=0;i<edObj.curNode.length;i++){
			ary.push(edObj.curNode[i].mapData.posData.points);
		}
		return mapMath.getRectFromPointsArys(ary);
	},
	toLeft:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aL=rc.left,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var eL=edObj.curNode[i].mapData.posData.x;
			if(eL!=aL){
				isDo=true;
				edObj.curNode[i].x=edObj.curNode[i].x+(aL-eL);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'左对齐'
			//});
		}
	},
	toRight:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aR=rc.right,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var posData=edObj.curNode[i].mapData.posData;
			var eR=posData.x+(posData.center.x*2);
			if(eR!=aR){
				isDo=true;
				edObj.curNode[i].x=edObj.curNode[i].x+(aR-eR);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'右对齐'
			//});
		}
	},
	toTop:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aT=rc.top,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var eT=edObj.curNode[i].mapData.posData.y;
			if(eT!=aT){
				isDo=true;
				edObj.curNode[i].y=edObj.curNode[i].y+(aT-eT);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'上对齐'
			//});
		}
	},
	toBottom:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aB=rc.bottom,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var posData=edObj.curNode[i].mapData.posData;
			var eB=posData.y+(posData.center.y*2);
			if(eB!=aB){
				isDo=true;
				edObj.curNode[i].y=edObj.curNode[i].y+(aB-eB);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'下对齐'
			//});
		}
	},
	//垂直对齐
	toVert:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aV=rc.left+rc.width/2,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var posData=edObj.curNode[i].mapData.posData;
			var eV=posData.x+posData.center.x;
			if(eV!=aV){
				isDo=true;
				edObj.curNode[i].x=edObj.curNode[i].x+(aV-eV);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'垂直对齐'
			//});
		}
	},
	//水平对齐
	toHorz:function(){
		var rc=this.getRect();
		if(!rc){
			return;
		}
		var aH=rc.top+rc.height/2,
			isDo=false;
		for(var i=0;i<edObj.curNode.length;i++){
			var posData=edObj.curNode[i].mapData.posData;
			var eH=posData.y+posData.center.y;
			if(eH!=aH){
				isDo=true;
				edObj.curNode[i].y=edObj.curNode[i].y+(aH-eH);
				mapPolygon.updatePolygonPos('move',edObj.curNode[i]);
				mapPolygon.pathPtMove(edObj.curNode[i]);
			}
		}
		if(isDo){
			//mapHistory.appendHistory({
			//	name:'水平对齐'
			//});
		}
	}
}
//框选
var mapBoxSel={
	box:{
		node:null,
		from:{
			x:-1,
			y:-1
		},
		to:{
			x:-1,
			y:-1
		}
	},
	selects:[],
	print:function(){
		var node=this.box.node,
			from={
				x:this.box.from.x-edObj.width/2,
				y:this.box.from.y-edObj.height/2
			},
			to={
				x:this.box.to.x-edObj.width/2,
				y:this.box.to.y-edObj.height/2
			};
		if(node){
			node.clear();
			node.beginFill('0xffffff',0.4);
			
			node.lineStyle (2,'0x000000');
			node.moveTo(from.x,from.y);
			node.lineTo(to.x,from.y);
			node.lineTo(to.x,to.y);
			node.lineTo(from.x,to.y);
			node.lineTo(from.x,from.y);
			
			node.endFill();

			node.rotation=0;
		}else{
			node=new PIXI.Graphics();
			node.beginFill('0xffffff',0.4);
			
			node.lineStyle (2,'0x000000');
			node.moveTo(from.x,from.y);
			node.lineTo(to.x,from.y);
			node.lineTo(to.x,to.y);
			node.lineTo(from.x,to.y);
			node.lineTo(from.x,from.y);
			
			node.mapData={};
			node.mapData.type='boxSelRect';
			
			edObj.mapBg.addChild(node);
			this.box.node=node;
		}
	},
	getSelectNodes:function(rc){
		var polygons=mapPolygon.getPolygons(),
			sels=[];
		for(var i=0;i<polygons.length;i++){
			var points=polygons[i].mapData.posData.points,
				isCross=false;
			//先判断多边形的点是否在矩形内
			for(var j=0;j<points.length;j++){
				if(mapMath.isInRect(points[j],rc)){
					isCross=true
					break;
				}
			}
			//判断矩形的点是否在多边形内
			if(!isCross){
				var pts=[
				{x:rc.left,y:rc.top},
				{x:rc.right,y:rc.top},
				{x:rc.right,y:rc.bottom},
				{x:rc.left,y:rc.bottom}
				];
				for(var j=0;j<pts.length;j++){
					if(mapMath.isInPolygon(pts[j],points)){
						isCross=true;
						break;
					}
				}
			}
			if(isCross){
				sels.push(polygons[i]);
			}
		}
		return sels;
	},
	doSelect:function(sels){
		var polygons=mapPolygon.getPolygons();
		
		if(edObj.keyStatus.isCtrl===false){//没有ctrl
			edObj.curNode=[];
			for(var i=0;i<polygons.length;i++){
				var isSel=false;
				for(var j=0;j<sels.length;j++){
					if(polygons[i]===sels[j]){
						isSel=true;
					}
				}
				if(isSel){//选择
					mapPolygon.selectNode(polygons[i],true);
					/*polygons[i].mapData.selected=true;
					//polygons[i].alpha=0.5;
					mapPolygon.paintSelectNode(polygons[i],true);
					edObj.curNode.push(polygons[i]);
					mapPolygon.editNodeMode(polygons[i],true);*/
				}else if(polygons[i].mapData&&polygons[i].mapData.selected==true){//取消选择
					mapPolygon.selectNode(polygons[i],false);
					/*polygons[i].mapData.selected=false;
					//polygons[i].alpha=1;
					mapPolygon.editNodeMode(polygons[i],false);
					mapPolygon.paintSelectNode(polygons[i],false);*/
				}
			}
		}else{//有ctrl
			for(var i=0;i<sels.length;i++){
				if(sels[i].mapData&&sels[i].mapData.selected==true){//之前选中的取消选中
					mapPolygon.selectNode(sels[i],false);
					/*sels[i].mapData.selected=false;
					//sels[i].alpha=1;
					mapPolygon.paintSelectNode(sels[i],false);
					mapPolygon.editNodeMode(sels[i],false);
					var idx=edObj.curNode.indexOf(sels[i]);
					edObj.curNode.splice(idx,1);*/
				}else{//选中
					mapPolygon.selectNode(sels[i],true);
					/*sels[i].mapData.selected=true;
					//sels[i].alpha=0.5;
					mapPolygon.paintSelectNode(sels[i],true);
					edObj.curNode.push(sels[i]);
					mapPolygon.editNodeMode(sels[i],true);*/
				}
			}
			/*if(isSame){
				for(var i=0;i<edObj.curNode.length;i++){
					if(edObj.curNode[i]===node){//取消选择
						node.mapData.selected=false;
						node.alpha=1;
						this.editNodeMode(node,false);
						var idx=edObj.curNode.indexOf(node);
						edObj.curNode.splice(idx,1);
						break;
					}
				}
			}else{//选择
				node.mapData.selected=true;
				node.alpha=0.5;
				edObj.curNode.push(node);
				this.editNodeMode(node,true);
			}*/
		}
		mapDetails.showSelPolygon();//多边形详情
	},
	reset:function(){
		
	},
	start:function(ele,e){
		ele.boxing=true;
		this.box.from=mapMath.getMapPointInAppPos({x:e.pageX,y:e.pageY});
	},
	move:function(ele,e){
		this.box.to=mapMath.getMapPointInAppPos({x:e.pageX,y:e.pageY});
		this.print();
	},
	end:function(ele,e,callback){
		ele.boxing=false;
		if(this.box.to.x===-1){
			this.box.to={
				x:this.box.from.x+1,
				y:this.box.from.y+1,
			}
		}
		
		
		var rect={
			left:Math.round(Math.min(this.box.from.x,this.box.to.x)),
			top:Math.round(Math.min(this.box.from.y,this.box.to.y)),
			right:Math.round(Math.max(this.box.from.x,this.box.to.x)),
			bottom:Math.round(Math.max(this.box.from.y,this.box.to.y))
		};
		if(typeof callback=='function'){
			callback(rect);
		}
		
		edObj.mapBg.removeChild(this.box.node);
		this.box={
			node:null,
			from:{
				x:-1,
				y:-1
			},
			to:{
				x:-1,
				y:-1
			}
		};
	},
};


//锁定、解锁
function setLock(bLock){
	mapPolygon.lock(bLock);
}

//图层
var mapLayout={
	setLayoutVisible:function(type,bVisible){
		var nodes;
		if(type=='path'){
			nodes=mapPath.getPathPoints();
			areaPts=mapPolygon.getPolygons().map(function(area){
				var pt=area.children.filter(function(child){
					return (child.areaChildType&&child.areaChildType=='polyPath');
				});
				return pt[0];
			});
			nodes=nodes.concat(areaPts);
		}else if(type=='polygon'){
			nodes=mapPolygon.getPolygons();
		}
		nodes.forEach(function(item){
			item.visible=bVisible?true:false;
		});
	},
	setLayoutLock:function(type,bLock){
		var nodes;
		if(type=='path'){
			nodes=mapPath.getPathPoints();
		}else if(type=='polygon'){
			nodes=mapPolygon.getPolygons();
			nodes.forEach(function(item){
				mapPolygon.lockNode(item,bLock?true:false);
			});
		}
	}
}
