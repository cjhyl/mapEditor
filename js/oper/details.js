var mapDetails={
	init:function(){
		
	},
	clear:function(){
		var areaDetail=$('.detailBg .details.area'),
			pathDetail=$('.detailBg .details.path');
		if(areaDetail.children().length>0){
			areaDetail.children().remove();
		}
		if(pathDetail.children().length>0){
			pathDetail.children().remove();
		}
	},
	selTab:function(idx){
		var tabAry=['area','path'];
		var lis=$('.detailBg>.tab>li');
		var bgs=$('.detailBg>.details');
		lis.removeClass('sel');
		bgs.hide();
		lis.eq(idx).addClass('sel');
		bgs.eq(idx).show();
	},
	showSelPolygon:function(){
		var doHtml='';
		doHtml+='<div>';
		doHtml+='<div class="row"><div class="label" style="width:100%;">批量修改:</div></div>';
		doHtml+='<div class="row"><div class="label">类型：</div>'+this.getBatchAreaType()+'</div>';
		doHtml+='<div class="row"><div class="label">背景颜色：</div><input type="text" class="colorBox" value="'+mapTopMenu.setDatas.polygon.fillColor+'" onchange="mapDetails.changeBatchAreaData(2,this)" /></div>';
		doHtml+='<div class="line"></div></div>';
		for(i=0;i<edObj.curNode.length;i++){
			var data=edObj.curNode[i].mapData;
			var oArea=data.oldData.area;
			var textColor=oArea.TextColor.replace('0x','').replace('#','');
			if(textColor=='0'){
				textColor='000000';
			}
			doHtml+='<div>';
			doHtml+='<div class="row">['+i+']:</div>';
			doHtml+='<div class="row"><div class="label">ID:</div><input type="text" disabled="disabled" value="'+data.areaId+'"/></div>';
			doHtml+='<div class="row"><div class="label">寻路点ID:</div><input type="text" disabled="disabled" value="'+data.oldData.point.PointID+'"/></div>';
			doHtml+='<div class="row"><div class="label">类型：</div>'+this.getAreaType(i,oArea.AreaTypeID)+'</div>';
			doHtml+='<div class="row"><div class="label">区域：</div><div class="txt">'+this.getBuilding(i,oArea.BuildingID)+'</div></div>';
			doHtml+='<div class="row"><div class="label">面积：</div><input type="text" data-idx="'+i+'" onchange="mapDetails.changeAcreage(this)" value="'+oArea.Acreage+'" /></div>';
			doHtml+='<div class="row"><div class="label">名称：</div><div class="txt"></div></div>';
			doHtml+='<div class="row"><div class="label">编号：</div><input type="text" data-idx="'+i+'" onchange="mapDetails.changeAreaNo(this)" value="'+oArea.Name+'" /></div>';
			doHtml+='<div class="row"><div class="label">背景颜色：</div><input type="text" class="colorBox" value="'+data.color.replace('0x','')+'" data-idx="'+i+'" onchange="mapDetails.changeColor(this)" /></div>';
			doHtml+='<div class="row"><div class="label">字体颜色：</div><input type="text" class="colorBox font" value="'+textColor+'" data-idx="'+i+'" onchange="mapDetails.changeName(this)" /></div>';
			doHtml+='<div class="row"><div class="label">字体大小：</div><input type="text" class="fontsize" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+oArea.FontSize+'" /></div>';
			doHtml+='<div class="row"><div class="label">标签偏移X</div><input type="text" class="fontx" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+oArea.TextX+'" /></div>';
			doHtml+='<div class="row"><div class="label">标签偏移Y</div><input type="text" class="fonty" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+oArea.TextY+'" /></div>';
			doHtml+='<div class="row"><div class="label">标签角度：</div><input type="text" placeholder="标签旋转0-360°" class="fontrot" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+oArea.TextRotate+'" /></div>';
			doHtml+='<div class="row"><div class="label">显示图标：</div><input type="checkbox" data-idx="'+i+'" onchange="mapDetails.changeShowIcon(this)" '+(oArea.IconMapping?'checked="checked"':'')+'/></div>';
			doHtml+='<div class="row"><div class="label">显示文本：</div><input type="checkbox" data-idx="'+i+'" onchange="mapDetails.changeShowText(this)" '+(oArea.TextMapping?'checked="checked"':'')+'/></div>';
			doHtml+='<div class="row"><div class="label">文本模式：</div>'+this.getTextShowType(i,oArea.TextDispayType)+'</div>';
			doHtml+='<div class="row"><div class="label">旋转：</div><input type="text" placeholder="元素旋转0-360°" data-idx="'+i+'" onchange="mapDetails.changeAngel(this)" /></div>';
			//var label=data.label;
			//doHtml+='<div>名称：<input class="name" placeholder="输入名称" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+(label?(label.txt?label.txt:''):'')+'" /></div>';
			//doHtml+='<div>颜色：<input class="colorBox font" value="'+(label?(label.color?label.color:'#000000'):'#000000').replace('#','')+'" data-idx="'+i+'" onchange="mapDetails.changeName(this)" /></div>';
			//doHtml+='<div>字体大小：<input class="fontsize" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+(label?(label.fontSize?label.fontSize:''):'')+'" /></div>';
			//doHtml+='<div>字体位置x：<input class="fontx" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+(label?(label.x?label.x:''):'')+'" /></div>';
			//doHtml+='<div>字体位置y：<input class="fonty" data-idx="'+i+'" onchange="mapDetails.changeName(this)" value="'+(label?(label.y?label.y:''):'')+'" /></div>';
			//doHtml+='<div><input type="checkbox" class="italic" id="polygonItalic"+'+i+' data-idx="'+i+'" onchange="mapDetails.changeName(this)" '+(label?(label.fontStyle=='italic'?'checked':''):'')+' /><label for="polygonItalic"+'+i+'>斜体</label>'
			//+'<input type="checkbox" class="bold" id="polygonBold"+'+i+' data-idx="'+i+'" onchange="mapDetails.changeName(this)" '+(label?(label.fontWeight=='bold'?'checked':''):'')+' /><label for="polygonBold"+'+i+'>加粗</label></div>';
			//var logo=data.logo;
			//console.log(logo)
			//doHtml+='<div>图标：<img class="logo" data-idx="'+i+'"'+(logo?' src="'+logo.url+'"':'')+' style="width:48px;height:48px;cursor:pointer;display:inline_block;" /></div>';
			//doHtml+='<div>图标位置x：<input class="logox" data-idx="'+i+'" onchange="mapDetails.changeLogo(this)" value="'+(logo?(logo.x?logo.x:''):'')+'" /></div>';
			//doHtml+='<div>图标位置y：<input class="logoy" data-idx="'+i+'" onchange="mapDetails.changeLogo(this)" value="'+(logo?(logo.y?logo.y:''):'')+'" /></div>';
			//doHtml+='<div>图标缩放：<input class="logoscale" data-idx="'+i+'" onchange="mapDetails.changeLogo(this)" value="'+(logo?(logo.scale?logo.scale:'1'):'1')+'" /></div>';
			doHtml+='<div style="cursor:pointer;" onclick="mapDetails.showNext(this)">位置:'+data.posData.x.toFixed(0)+','+data.posData.y.toFixed(0)+'</div>';
			var points=data.posData.points;
			doHtml+='<div style="display:none;">';
			for(var j=0;j<points.length;j++){
				doHtml+='['+j+']:'+data.posData.points[j].x.toFixed(0)+','+data.posData.points[j].y.toFixed(0)+'<br>';
			}
			doHtml+='</div><div class="line"></div></div>';
		}
		$('.detailBg .details.area').html(doHtml);
		var that=this;
		$('.detailBg .details.area').find('img.logo').off('click').on('click',function(e){
			e.stopPropagation();
			var ele=this;
			mapTopMenu.iconListShow(ele,function(src){
				ele.src=src;
				that.changeLogo(ele);
			});
		});
		jscolor.init();
	},
	showSelPath:function(){
		var doHtml="";
		for(i=0;i<mapPath.selPt.length;i++){
			var data=mapPath.selPt[i].mapData;
			doHtml+='<div>['+i+']:</div>';
			doHtml+='<div>ID:'+mapPath.selPt[i].mapData.PointID+'</div>';
			doHtml+='<div>位置:'+data.posData.x.toFixed(0)+','+data.posData.y.toFixed(0)+'</div>';
			var links=data.links;
			doHtml+='<div style="cursor:pointer;" onclick="mapDetails.showNext(this)">链接:'+((links&&links.length)?links.length:0)+'点</div>';
			doHtml+='<div style="display:none;">';
			for(var j=0;j<links.length;j++){
				doHtml+='['+j+']:'+links[j]+'<br>';
			}
			doHtml+='</div><div class="line"></div>';
		}
		$('.detailBg .details.path').html(doHtml);
	},
	showNext:function(ele){
		var next=$(ele).next();
		if(next.css('display')=='none'){
			next.show();
		}else{
			next.hide();
		}
	},
	//组建区域类型下拉框
	getAreaType:function(idx,value){
		if(!mapServerData.data.areaType||mapServerData.data.areaType.length<1){
			return '无类型数据';
		}
		var selHtml='<select data-idx="'+idx+'" onchange="mapDetails.changeAreaType(this)">';
		selHtml+='<option selected="selected" disabled="disabled" style="display:none" value="-1"></option>';
		for(var i=0;i<mapServerData.data.areaType.length;i++){
			var isSel='';
			if(value==mapServerData.data.areaType[i].AreaTypeID){
				isSel='selected="selected"';
			}
			selHtml+='<option value="'+mapServerData.data.areaType[i].AreaTypeID+'" '+isSel+'>'+mapServerData.data.areaType[i].Name+'</option>';
		}
		selHtml+='</select>';
		return selHtml;
	},
	//组建批量区域类型下拉框
	getBatchAreaType:function(){
		if(!mapServerData.data.areaType||mapServerData.data.areaType.length<1){
			return '无类型数据';
		}
		var selHtml='<select onchange="mapDetails.changeBatchAreaData(1,this)">';
		selHtml+='<option selected="selected" disabled="disabled" style="display:none" value="-1"></option>';
		for(var i=0;i<mapServerData.data.areaType.length;i++){
			selHtml+='<option value="'+mapServerData.data.areaType[i].AreaTypeID+'" >'+mapServerData.data.areaType[i].Name+'</option>';
		}
		selHtml+='</select>';
		return selHtml;
	},
	//组建文本显示类型下拉框
	getTextShowType:function(idx,value){
		var typeData=[
			{id:'1',text:'显示名称'},
			{id:'2',text:'显示编号'},
			{id:'3',text:'显示名称+编号'},
		];
		var selHtml='<select data-idx="'+idx+'" onchange="mapDetails.changeTextShowType(this)">';
		selHtml+='<option selected="selected" disabled="disabled" style="display:none" value="-1"></option>';
		for(var i=0;i<typeData.length;i++){
			var isSel='';
			if(value==typeData[i].id){
				isSel='selected="selected"';
			}
			selHtml+='<option value="'+typeData[i].id+'" '+isSel+'>'+typeData[i].text+'</option>';
		}
		selHtml+='</select>';
		return selHtml;
	},
	getBuilding:function(idx,value){
		if(!mapServerData.data.building||mapServerData.data.building.length<1){
			return '无建筑区域数据';
		}
		var data=mapServerData.data.building;
		for(var i=0;i<data.length;i++){
			if(data[i].BuildingID==value){
				return data[i].Name;
			}
		}
		return '没查询到建筑区域数据';
	},
	//批量修改区域属性
	changeBatchAreaData:function(type,ele){
		var areas=edObj.curNode;
		if(areas.length<1){
			return;
		}
		var local=[],server=[];
		for(var i=0;i<areas.length;i++){
			var ltemp={};
			ltemp.type='update';
			ltemp.from=JSON.stringify(areas[i].mapData);
			local.push(ltemp);
		}
		var sType="";
		if(type==1){//类型
			sType="区域类型";
			var changeType=$(ele).val();
			console.log('changeType',changeType);
			for(var i=0;i<areas.length;i++){
				areas[i].mapData.oldData.area.AreaTypeID=changeType;
				local[i].to=JSON.stringify(areas[i].mapData);
				server.push({
					type:'updateArea',
					data:mapServerData.getDataFromNode('updateArea',areas[i])
				});
			}
		}
		if(type==2){//背景色
			sType="背景色";
			var changeColor='0x'+$(ele).val();
			console.log('changeColor',changeColor);
			for(var i=0;i<areas.length;i++){
				areas[i].mapData.oldData.area.Color=changeColor;
				mapPolygon.repaintRect(areas[i],areas[i].mapData.posData.points,changeColor);
				local[i].to=JSON.stringify(areas[i].mapData);
				server.push({
					type:'updateArea',
					data:mapServerData.getDataFromNode('updateArea',areas[i])
				});
			}
		}
		mapHistory.appendHistory({
			name:'批量修改'+sType,
			server:server,
			local:local
		});
	},
	//修改区域类型
	changeAreaType:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var type=$(ele).val();
		var node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);

		node.mapData.oldData.area.AreaTypeID=type;

		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'改类型',
			server:server,
			local:local
		});
		//mapServerData.changeServer({//上传服务器数据
		//	type:'updateArea',
		//	data:mapServerData.getDataFromNode('updateArea',node)
		//});
	},
	changeAcreage:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);

		node.mapData.oldData.area.Acreage=$(ele).val();

		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改面积',
			server:server,
			local:local
		});
	},
	//修改背景色
	changeColor:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var color='0x'+$(ele).val();
		var node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		node.mapData.oldData.area.Color=color;
		mapPolygon.repaintRect(node,node.mapData.posData.points,color);

		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改区域背景色',
			server:server,
			local:local
		});
		mapPolygon.updateOldData(node);
		//mapServerData.changeServer({//上传服务器数据
		//	type:'updateArea',
		//	data:mapServerData.getDataFromNode('updateArea',node)
		//});
	},
	//修改编号
	changeAreaNo:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var node=edObj.curNode[$(ele).attr('data-idx')];
		
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		node.mapData.oldData.area.Name=$(ele).val();
		mapPolygon.addText(node,node.mapData.oldData.area);
		
		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'改编号',
			server:server,
			local:local
		});
	},
	//是否显示图标
	changeShowIcon:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var node=edObj.curNode[$(ele).attr('data-idx')];
		
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		node.mapData.oldData.area.IconMapping=$(ele).prop('checked');
		mapPath.updatePointStyle(node);
		//mapPolygon.addText(node,node.mapData.oldData.area);
		
		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改图标显示',
			server:server,
			local:local
		});
	},
	//是否显示文本
	changeShowText:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var node=edObj.curNode[$(ele).attr('data-idx')];
		
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		node.mapData.oldData.area.TextMapping=$(ele).prop('checked');
		mapPolygon.addText(node,node.mapData.oldData.area);
		
		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改标签显示',
			server:server,
			local:local
		});
	},
	//是否标签显示类型
	changeTextShowType:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var node=edObj.curNode[$(ele).attr('data-idx')];
		
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		node.mapData.oldData.area.TextDispayType=$(ele).val();
		mapPolygon.addText(node,node.mapData.oldData.area);
		
		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改标签显示模式',
			server:server,
			local:local
		});
	},
	//修改角度
	changeAngel:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var angel=parseFloat($(ele).val())/57.29577951308233;
		var node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		if(typeof angel=='number'&&angel==angel){
			var ltemp={};
			ltemp.type='update';
			ltemp.from=JSON.stringify(node.mapData);

		    node.rotation=angel;
		    mapPolygon.updatePolygonPos('rot',node);//更新位置数据
			$(ele).val('');

			ltemp.to=JSON.stringify(node.mapData);
			var local=[ltemp];
			var server=[{
				type:'updateArea',
				data:mapServerData.getDataFromNode('updateArea',node)
			}];
		    mapHistory.appendHistory({
				name:'旋转',
				server:server,
				local:local
			});
			mapPolygon.updateOldData(node);
			//mapServerData.changeServer({//上传服务器数据
			//	type:'updateArea',
			//	data:mapServerData.getDataFromNode('updateArea',node)
			//});
		}
	},
	//修改标签属性
	changeName:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var pDiv=$(ele).parent().parent();
		var nameBox=pDiv.find('.name'),
			colorBox=pDiv.find('.colorBox.font'),
			sizeBox=pDiv.find('.fontsize'),
			xBox=pDiv.find('.fontx'),
			yBox=pDiv.find('.fonty'),
			rotBox=pDiv.find('.fontrot'),
			//italicBox=pDiv.find('.italic'),
			//boldBox=pDiv.find('.bold'),
			node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		
		var ltemp={};
		ltemp.type='update';
		ltemp.from=JSON.stringify(node.mapData);
		
		var color=colorBox.val()?colorBox.val():'000000',
			size=parseInt(sizeBox.val())?parseInt(sizeBox.val()):14,
			x=parseInt(xBox.val())?parseInt(xBox.val()):0,
			y=parseInt(yBox.val())?parseInt(yBox.val()):0;
			rot=parseInt(rotBox.val())?parseInt(rotBox.val()):0;
			//fontStyle=italicBox.prop('checked')?'italic':'normal',
			//fontWeight=boldBox.prop('checked')?'bold':'normal';
		node.mapData.oldData.area.TextColor='0x'+color;
		node.mapData.oldData.area.FontSize=size;
		node.mapData.oldData.area.TextX=x;
		node.mapData.oldData.area.TextY=y;
		node.mapData.oldData.area.TextRotate=rot;
		mapPolygon.addText(node,node.mapData.oldData.area);
		
		ltemp.to=JSON.stringify(node.mapData);
		var local=[ltemp];
		var server=[{
			type:'updateArea',
			data:mapServerData.getDataFromNode('updateArea',node)
		}];
		mapHistory.appendHistory({
			name:'修改标签属性',
			server:server,
			local:local
		});
	},
	/*changeName:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var pDiv=$(ele).parent().parent();
		var nameBox=pDiv.find('.name'),
			colorBox=pDiv.find('.colorBox.font'),
			sizeBox=pDiv.find('.fontsize'),
			xBox=pDiv.find('.fontx'),
			yBox=pDiv.find('.fonty'),
			italicBox=pDiv.find('.italic'),
			boldBox=pDiv.find('.bold'),
			node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		var name=nameBox.val(),
			color=colorBox.val()?colorBox.val():'000000',
			size=parseInt(sizeBox.val())?parseInt(sizeBox.val()):14,
			x=parseInt(xBox.val())?parseInt(xBox.val()):0,
			y=parseInt(yBox.val())?parseInt(yBox.val()):0,
			fontStyle=italicBox.prop('checked')?'italic':'normal',
			fontWeight=boldBox.prop('checked')?'bold':'normal';
		var obj={
			txt:name,
			color:'#'+color,
			fontSize: size,
			x:x,
			y:y,
			fontStyle:fontStyle,
			fontWeight:fontWeight
		};
		mapPolygon.addText(node,obj);
		mapHistory.appendHistory({
			name:'改名'
		});
	},*/
	changeLogo:function(ele){
		if(edObj.curNode.length<1){
			return;
		}
		var pDiv=$(ele).parent().parent();
		var logo=pDiv.find('img.logo'),
			xBox=pDiv.find('.logox'),
			yBox=pDiv.find('.logoy'),
			scaleBox=pDiv.find('.logoscale'),
			node=edObj.curNode[$(ele).attr('data-idx')];
		if(!node){
			return;
		}
		var url=logo.attr('src'),
			x=parseInt(xBox.val())?parseInt(xBox.val()):0,
			y=parseInt(yBox.val())?parseInt(yBox.val()):0,
			scale=parseFloat(scaleBox.val())?parseFloat(scaleBox.val()):1;
		var obj={
			url:url,
			x:x,
			y:y,
			scale:scale.toFixed(2)
		};
		mapPolygon.addLogo(node,obj);
		mapHistory.appendHistory({
			name:'改图标'
		});
	}
}
