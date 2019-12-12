//与服务器交互数据
var mapServerData={
	data:{
		url:'http://192.168.16.12:301/CkioskService/MapService.asmx/Command',
		href:'http://192.168.16.12:301/',
		BID:'',
		pid:'294808CD-F904-4C4E-B0A9-B2E25D598B9D',
		FloorID:'',
		floor:null,
		area:null,
		point:null,
		path:null,
		areaType:null,
		building:null
	},
	init:function(){
		//this.getUrlData();
		this.initLoad();
		this.bindEvent();
	},
	checkUrl:function(url){
		var dataStr=url.split('?')[1],
			ary=dataStr.split('&'),
			data={};
		ary.forEach(function(item){
			data[item.split('=')[0].toLowerCase()]=item.split('=')[1]
		});
		return data;
	},
	getUrlData:function(){
		var urlData=this.checkUrl(window.location.href);
		this.data.url=urlData.server;
		this.data.BID=urlData.bid;
		this.data.pid=urlData.pid;
		this.data.href=urlData.href;
	},
	initLoad:function(){
		var that=this;
		edObj.mapBg.removeChildren();
		that.data.floor=null;
		that.data.FloorID='';
		var txt='';
		that.setLoading(true,txt);
		that.loadFloor(function(r,d){
			if(r){
				txt+='<br>楼层数据读取完毕';
			}else{
				txt+='<br>楼层数据读取失败';
			}
			that.data.floor=d.v;
			that.doFloorSelectHtml(d.v);
			that.setLoading(true,txt);
			if(that.data.areaType&&that.data.building){
				setTimeout(function(){
					that.setLoading(false);
					$('#layoutBg').show();
					var floorId=that.data.floor[0].FloorID;
					$('#floorsSelect').val(floorId);
					that.data.FloorID=floorId;
					that.selectLoad(floorId,function(){
						that.repaintMapFromServer();
					});
				},500);
			}
		});
		/*that.loadArea(function(r,d){
			if(r){
				txt+='<br>区域数据读取完毕';
			}else{
				txt+='<br>区域数据读取失败';
			}
			that.data.area=d.v;
			that.setLoading(true,txt);
			if(that.data.floor&&that.data.point&&that.data.path&&that.data.areaType&&that.data.building){
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});
		that.loadPoint(function(r,d){
			if(r){
				txt+='<br>路径点数据读取完毕';
			}else{
				txt+='<br>路径点数据读取失败';
			}
			that.data.point=d.v;
			that.setLoading(true,txt);
			if(that.data.floor&&that.data.area&&that.data.path&&that.data.areaType&&that.data.building){
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});
		that.loadPath(function(r,d){
			if(r){
				txt+='<br>路径数据读取完毕';
			}else{
				txt+='<br>路径数据读取失败';
			}
			that.data.path=d.v;
			that.setLoading(true,txt);
			if(that.data.floor&&that.data.area&&that.data.point&&that.data.areaType&&that.data.building){
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});*/
		that.loadAreaType(function(r,d){
			if(r){
				txt+='<br>区域类型数据读取完毕';
			}else{
				txt+='<br>区域类型数据读取失败';
			}
			that.data.areaType=d.v;
			if(that.data.floor&&that.data.building){
				setTimeout(function(){
					that.setLoading(false);
					$('#layoutBg').show();
					var floorId=that.data.floor[0].FloorID;
					$('#floorsSelect').val(floorId);
					that.data.FloorID=floorId;
					that.selectLoad(floorId,function(){
						that.repaintMapFromServer();
					});
				},500);
			}
		});
		that.loadBuilding(function(r,d){
			if(r){
				txt+='<br>建筑数据读取完毕';
			}else{
				txt+='<br>建筑数据读取失败';
			}
			that.data.building=d.v;
			if(that.data.floor&&that.data.areaType){
				setTimeout(function(){
					that.setLoading(false);
					$('#layoutBg').show();
					var floorId=that.data.floor[0].FloorID;
					$('#floorsSelect').val(floorId);
					that.data.FloorID=floorId;
					that.selectLoad(floorId,function(){
						that.repaintMapFromServer();
					});
				},500);
			}
		});
	},
	//测试用按钮事件
	bindEvent:function(){
		var that=this;
		//图层按钮
		$('#layoutBg .li').on('click',function(){
			var bl=false;
			if($(this).attr('data-show')==1){
				bl=true;
			}
			var func='setLayoutVisible';
			/*if($(this).attr('class').indexOf('lock')!=-1){
				func='setLayoutLock';
			}*/
			var type='path';
			if($(this).attr('class').indexOf('polygon')!=-1){
				type='polygon';
			}
			mapLayout[func](type,bl);
			if($(this).attr('data-show')==1){
				$(this).attr('data-show',0);
			}else{
				$(this).attr('data-show',1);
			}
		});
		//各面板窗口时间
		$('.myDialog .topBg').on('mousedown',function(e){
			eleDrag({
				toDrag:$(this).parent().get(0),
				event:e
			});
		});
		$('.myDialog .toggle').on('click',function(e){
			if($(this).html()=='∧'){
				$(this).parent().next().hide();
				$(this).html('∨');
			}else{
				$(this).parent().next().show();
				$(this).html('∧');
			}
		});
	},
	//读取楼层
	loadFloor:function(callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getFloor","parameter":{"BID":"'+this.data.BID+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	/*data.v=data.v.sort(function(a,b){
            		return a.BuildingID==b.BuildingID;
            	});*/
            	callback(true,data);
            	console.log('floor',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	//区域
	loadArea:function(floorId,callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getArea","parameter":{"BID":"'+this.data.BID+'","FloorID":"'+floorId+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	callback(true,data);
            	console.log('area',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	//路径点
	loadPoint:function(floorId,callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getPoint","parameter":{"BID":"'+this.data.BID+'","FloorID":"'+floorId+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	callback(true,data);
            	console.log('point',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	//路径
	loadPath:function(callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getPath","parameter":{"BID":"'+this.data.BID+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	callback(true,data);
            	console.log('path',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	//区域类型
	loadAreaType:function(callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getAreaType","parameter":{"BID":"'+this.data.BID+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	callback(true,data);
            	console.log('areaType',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	//建筑
	loadBuilding:function(callback){
		$.ajax({
            type: "GET",
            url: this.data.url,
            data: {
				code: '{"pid":"'+this.data.pid+'","lan":"sc","command":"getBuilding","parameter":{"BID":"'+this.data.BID+'","RemoteOfflineType":"manual"}}'
			},
            dataType: "JSONP",
            success: function(data) {
            	callback(true,data);
            	console.log('building',data);
            },
            error: function(e) {
            	callback(false,e);
            }
		});
	},
	setLoading:function(bVisible,txt){
		if(bVisible){
			$('.loadingBg').show();
			$('.loadingBg .loadingTxt').html(txt);
		}else{
			$('.loadingBg').hide();
			$('.loadingBg .loadingTxt').html('');
		}
	},
	doFloorSelectHtml:function(data){
		var that=this,
			select=$('#floorsSelect'),
			selHtml='<option selected="selected" disabled="disabled" style="display:none" value=""></option>';
		for(var i=0;i<data.length;i++){
			selHtml+='<option value="'+data[i].FloorID+'">'+data[i].Name+'</option>';
		}
		$('#layoutBg').hide();
		select.show();
		select.html(selHtml);
		select.off('change').on('change',function(e){
			if(mapHistory.data.ary.length>0){
				showConfirm({
					title:'当前楼层有改动未提交，<br>是否提交？',
					btns:['提交','不提交'],
					callback:function(btn){
						if(btn==0){//提交
							select.val(that.data.FloorID);
							mapHistory.submitAll();
						}else{//不提交
							mapHistory.data.ary=[];
							mapHistory.doListHtml();
							$('#layoutBg').show();
							var floorId=select.val();
							that.data.FloorID=floorId;
							that.selectLoad(floorId,function(){
								that.repaintMapFromServer();
							});
							//that.repaintMapFromServer(floorId);
						}
					}
				})
			}else{
				$('#layoutBg').show();
				var floorId=$(this).val();
				that.data.FloorID=floorId;
				that.selectLoad(floorId,function(){
					that.repaintMapFromServer();
				});
			}
			//$('#layoutBg').show();
			//var floorId=$(this).val();
			//that.data.FloorID=floorId;
			//that.repaintMapFromServer(floorId);
		});
	},
	selectLoad:function(floorId,callback){
		var that=this;
		var txt='';
		
		that.data.area=null;
		that.data.point=null;
		that.data.path=null;
		
		that.loadArea(floorId,function(r,d){
			if(r){
				txt+='<br>区域数据读取完毕';
			}else{
				txt+='<br>区域数据读取失败';
			}
			that.data.area=d.v;
			that.setLoading(true,txt);
			if(that.data.point&&that.data.path){
				callback();
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});
		that.loadPoint(floorId,function(r,d){
			if(r){
				txt+='<br>路径点数据读取完毕';
			}else{
				txt+='<br>路径点数据读取失败';
			}
			that.data.point=d.v;
			that.setLoading(true,txt);
			if(that.data.area&&that.data.path){
				callback();
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});
		that.loadPath(function(r,d){
			if(r){
				txt+='<br>路径数据读取完毕';
			}else{
				txt+='<br>路径数据读取失败';
			}
			that.data.path=d.v;
			that.setLoading(true,txt);
			if(that.data.area&&that.data.point){
				callback();
				setTimeout(function(){
					that.setLoading(false);
				},500);
			}
		});
	},
	repaintMapFromServer:function(){
		if(!this.data.area||!this.data.path||!this.data.point){
			return;
		}
		
		$('#layoutBg .li').attr('data-show',0);
		mapDetails.clear();
		edObj.mapBg.removeChildren();
		edObj.curNode=[];
		mapPath.selPt=[];
		var areas=this.data.area;//.filter(function(item){
		//	return item.FloorID==floorId;
		//});
		var points=this.data.point;//.filter(function(item){
		//	return item.FloorID==floorId;
		//});
		var paths=this.data.path;//.filter(function(item){
		//	return true;
		//});
		var data={};
		data.polygons=[];
		data.paths=[];
		var d={};
		for(var i=0;i<points.length;i++){
			var temp={};
			temp.oldData=points[i];
			temp.type='path';
			temp.x=Math.round(points[i].X);
			temp.y=Math.round(points[i].Y);
			temp.PointID=points[i].PointID;
			temp.links=[];
			d[points[i].PointID]=temp;
			data.paths.push(temp);
		}
		for(var i=0;i<areas.length;i++){
			var temp={};
			temp.oldData={};
			temp.oldData.area=areas[i];
			for(var j=0;j<points.length;j++){
				if(points[j].PointID==areas[i].PointID){
					temp.oldData.point=points[j];
					break;
				}
			}
			temp.color=areas[i].Color;
			temp.points=areas[i].Area.split('|').map(function(item){
				return {
					x:Math.round(item.split(',')[0]),
					y:Math.round(item.split(',')[1])
				}
			});
			temp.areaID=areas[i].AreaID;
			temp.type='polygon';
			temp.path={};
			temp.path.PointID=areas[i].PointID;
			temp.path.x=Math.round(areas[i].PointX);
			temp.path.y=Math.round(areas[i].PointY);
			temp.path.links=[];
			d[areas[i].PointID]=temp;
			data.polygons.push(temp);
			for(var j=0;j<data.paths.length;j++){
				if(data.paths[j].PointID==areas[i].PointID){
					data.paths.splice(j,1);
					break;
				}
			}
		}

		for(var i=0;i<paths.length;i++){
			var sId=paths[i].PointID;
			var eId=paths[i].EndPointID;
			if(sId==eId){
				continue;
			}
			var sNode=d[sId];
			var eNode=d[eId];
			var sLinks=null;
			var eLinks=null;
			if(sNode){
				sLinks=sNode.type=='polygon'?sNode.path.links:sNode.links;
			}
			if(eNode){
				eLinks=eNode.type=='polygon'?eNode.path.links:eNode.links;
			}
			if(sLinks&&sLinks.indexOf(eId)==-1){
				sLinks.push(eId);
			}
			if(eLinks&&eLinks.indexOf(sId)==-1){
				eLinks.push(sId);
			}
		}
		rePaintMap(data);
		
		var mapUrl="";
		for(var i=0;i<this.data.floor.length;i++){
			if(this.data.FloorID==this.data.floor[i].FloorID){
				mapUrl=this.data.floor[i].MapUrl;
				break;
			}
		}
		if(mapUrl){
			mapBg.importImageFromUrl(this.data.href+mapUrl);
		}
	},
	changeServer:function(obj){
		obj.url=this.data.url;
		if(obj.type=='addPath'||obj.type=='delPath'){
			this.changeLocalData({
				type:obj.type,
				data:obj.data.node
			});
			//添加路径
			if(obj.data&&obj.data.code){
				$.ajax({
		            type: "POST",
		            url: obj.url,
		            data: {
		            	code:obj.data.code
					},
		            dataType: "JSONP",
		            success: function(data) {
		            	console.log(obj.type+' ok',data);
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('ok')
		            	}
		            },
		            error: function(e) {
		            	console.log(obj.type+' error',e);
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('error')
		            	}
		            }
				});
			}
			obj.data.node=null;
		}
		
		
		if(obj.type=='addArea'||obj.type=='delArea'||obj.type=='updateArea'){
			this.changeLocalData({
				type:obj.type,
				data:obj.data.node.mapData.oldData.area
			});
			this.changeLocalData({
				type:obj.type.replace('Area','Point'),
				data:obj.data.node.mapData.oldData.point
			});
			//更新区域
			$.ajax({
	            type: "POST",
	            url: obj.url,
	            data: {
	            	code:obj.data.code
				},
	            dataType: "JSONP",
	            success: function(data) {
	            	console.log(obj.type+' ok',data);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('ok')
	            	}
	            },
	            error: function(e) {
	            	console.log(obj.type+' error',e);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('error')
	            	}
	            }
			});
			//更新点
			$.ajax({
	            type: "POST",
	            url: obj.url,
	            data: {
	            	code:obj.data.pCode
				},
	            dataType: "JSONP",
	            success: function(data) {
	            	console.log(obj.type+' point ok',data);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('ok')
	            	}
	            },
	            error: function(e) {
	            	console.log(obj.type+' point error',e);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('error')
	            	}
	            }
			});
			obj.data.node=null;
		}
		
		if(obj.type=='addPoint'||obj.type=='delPoint'||obj.type=='updatePoint'){
			this.changeLocalData({
				type:obj.type,
				data:obj.data.node.mapData.oldData
			});
			$.ajax({
	            type: "POST",
	            url: obj.url,
	            data: {
	            	code:obj.data.code
				},
	            dataType: "JSONP",
	            success: function(data) {
	            	console.log(obj.type+' ok',data);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('ok')
	            	}
	            },
	            error: function(e) {
	            	console.log(obj.type+' error',e);
	            	if(obj.callback&&typeof obj.callback=='function'){
	            		obj.callback('error')
	            	}
	            }
			});
			obj.data.node=null;
		}
	},
	getDataFromNode:function(type,node,localSave){
		if(type=='addPath'||type=='delPath'){
			/*
			 * node:{sid:123,eid:123}
			 */
			//路径数据
			var link=this.checkData('path',node);
			//1、添加路径时，发现有该路径了  2、删除路径时，发现没有符合要求的路径
			if((type=='addPath'&&link)||(type=='delPath'&&!link)){
				if(localSave){//是否本地保存
					return {
						search:false,
						code:node
					};
				}else{
					return null;
				}
			}
			
			var data={};
			data.code={};
			data.code.pid=this.data.pid;
			data.code.lan='sc';
			data.code.command=type;
			var pathId;
			if(type=='delPath'){
				pathId=link.PathID;
				data.node=link;
			}else if(type=='addPath'){
				pathId='PATH-'+mapMath.formatTimespan(edObj.uid)+'-'+parseInt(Math.random()*4000);
				edObj.uid++;
				data.node={
					EndPointID:node.eid,
					PathID:pathId,
					PointID:node.sid
				};
			}
			data.code.parameter={
				EndPointID:node.eid,
				PointID:node.sid,
				BID:this.data.BID,
				PathID:pathId,
				RemoteOfflineType:"manual",
			};
			data.code=JSON.stringify(data.code);
			return data;
		}
		if(type=='addPoint'||type=='delPoint'||type=='updatePoint'){
			/*
			 * node:区域元素节点
			 */
			
			var data={};
			data.node=node;
			//点
			data.code={};
			data.code.pid=this.data.pid;
			data.code.lan='sc';
			data.code.command=type;
			data.code.parameter={
				name:node.mapData.oldData.name,
				RemoteOfflineType:'manual',
				PointID:node.mapData.PointID,
				BID:this.data.BID,
				FloorID:node.mapData.oldData.FloorID,
				X:node.mapData.posData.x,
				Y:node.mapData.posData.y,
			};
			//点end
			/*if(type=='updatePoint'){
				mapPath.updateOldData(node);
			}*/
			data.code=JSON.stringify(data.code);
			return data;
			
		}
		if(type=='addArea'||type=='delArea'||type=='updateArea'){
			/*
			 * node:路径点元素节点
			 */
			var data={};
			data.node=node;
			//区域
			data.code={};
			data.code.pid=this.data.pid;
			data.code.lan='sc';
			data.code.command=type;
			data.code.parameter={
				Area:node.mapData.posData.points.map(function(item){
						return item.x+','+item.y;
				}).join('|'),
				AreaID:node.mapData.areaId,
				BuildingID:mapServerData.data.BID,
				FloorID:mapServerData.data.FloorID,
				PointID:node.mapData.path.PointID,
				PointX:node.mapData.path.x,
				PointY:node.mapData.path.y,
				CPointID:(node.mapData.posData.x+node.mapData.posData.center.x)+','+(node.mapData.posData.y+node.mapData.posData.center.y),
				Color:node.mapData.color,
				AreaTypeID:node.mapData.oldData.area.AreaTypeID,
				TextColor:node.mapData.oldData.area.TextColor,
				FontSize:node.mapData.oldData.area.FontSize,
				
				TextMapping:node.mapData.oldData.area.TextMapping,
				IconMapping:node.mapData.oldData.area.IconMapping,
				IconRotate:node.mapData.oldData.area.IconRotate,
				TextRotate:node.mapData.oldData.area.TextRotate,
				IconScale:node.mapData.oldData.area.IconScale,
				Name:node.mapData.oldData.area.Name,
				Acreage:node.mapData.oldData.area.Acreage,
				TextDispayType:node.mapData.oldData.area.TextDispayType,
				TextX:node.mapData.oldData.area.TextX,
				TextY:node.mapData.oldData.area.TextY,
				TextW:node.mapData.oldData.area.TextW,
				TextH:node.mapData.oldData.area.TextH,
				IconX:node.mapData.oldData.area.IconX,
				IconY:node.mapData.oldData.area.IconY,
				
				Remark:"",
				IsDamage:"",
				RemoteOfflineType:"manual",
				BID:this.data.BID,
			};
			data.code=JSON.stringify(data.code);
			//区域end
			//点
			var pType;
			if(type=='addArea'){
				pType='addPoint';
			}
			if(type=='delArea'){
				pType='delPoint';
			}
			if(type=='updateArea'){
				pType='updatePoint';
			}
			data.pCode={};
			data.pCode.pid=this.data.pid;
			data.pCode.lan='sc';
			data.pCode.command=pType;
			data.pCode.parameter={
				name:node.mapData.oldData.point.name,
				RemoteOfflineType:'manual',
				PointID:node.mapData.oldData.point.PointID,
				BID:this.data.BID,
				FloorID:node.mapData.oldData.point.FloorID,
				X:node.mapData.path.x,
				Y:node.mapData.path.y,
			}
			data.pCode=JSON.stringify(data.pCode);
			//点end
			/*if(type=='updateArea'){
				mapPolygon.updateOldData(node);
			}*/
			return data;
		}
	},
	checkData:function(type,data){
		if(type=='path'){
			var path=this.data.path;
			for(var i=0;i<path.length;i++){
				if((path[i].PointID==data.sid&&path[i].EndPointID==data.eid)
				||(path[i].PointID==data.eid&&path[i].EndPointID==data.sid)
				||path[i].PathID==data.PathID){
					return path[i]
				}
			}
			return false;
		}
		if(type=='area'){
			var area=this.data.area;
			for(var i=0;i<area.length;i++){
				if(area[i].AreaID==data.AreaID){
					return area[i];
				}
			}
			return false;
		}
		if(type=='point'){
			var point=this.data.point;
			for(var i=0;i<point.length;i++){
				if(point[i].PointID==data.PointID){
					return point[i];
				}
			}
			return false;
		}
	},
	//修改本地数据
	changeLocalData:function(obj){
		//确定操作的数据
		var datas,type,idKey,index=-1,data;
		if(obj.type.indexOf('Area')!=-1){
			datas=this.data.area;
			type='area';
			idKey='AreaID';
		}
		if(obj.type.indexOf('Path')!=-1){
			datas=this.data.path;
			type='path';
			idKey='PathID';
		}
		if(obj.type.indexOf('Point')!=-1){
			datas=this.data.point;
			type='point';
			idKey='PointID';
		}
		//查询数据
		for(var i=0;i<datas.length;i++){
			if(datas[i][idKey]==obj.data[idKey]){
				data=datas[i];
				index=i;
				break;
			}
		}
		//执行操作
		if(obj.type.indexOf('del')!=-1&&index!=-1){
			datas.splice(index);
		}
		if(obj.type.indexOf('add')!=-1){
			if(!this.checkData(type,datas)){
				datas.push(obj.data);
			}
		}
		if(obj.type.indexOf('update')!=-1&&index!=-1){
			datas[index]=data;
		}
	},
	svg:{
		maxNum:null,
		curNum:[],
		import:function(file){
			var that=this;
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
								})
			    		};
			    			polygons.push(obj);
			    		});
			    		temp.polygons=polygons;
		    		}
		    		that.maxNum=temp.polygons.length;
		    		that.curNum=0;
		    		that.paintAndPost(temp);
		    	}
		    	$(file).val('');
		    };
		},
		paintAndPost:function(data){
			var that=this;
			mapServerData.setLoading(true,'提交中...<br>'+this.curNum+'/'+this.maxNum)
			for(var i=0;i<data.polygons.length;i++){
				var node=mapPolygon.append({
					points:data.polygons[i].points,
					color:data.polygons[i].color
				});
				var server={
					type:'addArea',
					data:mapServerData.getDataFromNode('addArea',node)
				};
				this.postData({
					status:{
						area:false,
						point:false
					},
					type:'addArea',
					data:mapServerData.getDataFromNode('addArea',node),
					callback:function(){
						if(that.curNum<that.maxNum){
							mapServerData.setLoading(true,'提交中...<br>'+that.curNum+'/'+that.maxNum);
						}else{
							mapServerData.setLoading(true,'提交完毕<br>'+that.curNum+'/'+that.maxNum);
							setTimeout(function(){
								mapServerData.setLoading(false);
							},1000);
						}
					}
				})
			}
		},
		postData:function(obj){
			var that=this;
			obj.url=mapServerData.data.url;
			if(obj.type=='addArea'){
				mapServerData.changeLocalData({
					type:obj.type,
					data:obj.data.node.mapData.oldData.area
				});
				mapServerData.changeLocalData({
					type:obj.type.replace('Area','Point'),
					data:obj.data.node.mapData.oldData.point
				});
				//更新区域
				$.ajax({
		            type: "POST",
		            url: obj.url,
		            data: {
		            	code:obj.data.code
					},
		            dataType: "JSONP",
		            success: function(data) {
		            	obj.status.area=true;
		            	if(obj.status.point===true){
		            		that.curNum++;
		            		console.log(that.curNum);
		            	}
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('ok')
		            	}
		            },
		            error: function(e) {
		            	console.log(obj.type+' error',e);
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('error')
		            	}
		            }
				});
				//更新点
				$.ajax({
		            type: "POST",
		            url: obj.url,
		            data: {
		            	code:obj.data.pCode
					},
		            dataType: "JSONP",
		            success: function(data) {
		            	obj.status.point=true;
		            	if(obj.status.area===true){
		            		that.curNum++;
		            		console.log(that.curNum);
		            	}
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('ok')
		            	}
		            },
		            error: function(e) {
		            	console.log(obj.type+' point error',e);
		            	if(obj.callback&&typeof obj.callback=='function'){
		            		obj.callback('error')
		            	}
		            }
				});
				obj.data.node=null;
			}
		}
	},
}