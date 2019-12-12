//历史记录
var mapHistory={
	//历史记录操作名称映射--预留
	data:{
		maxLen:5,
		ary:[],
		maxSend:0,
		curSend:0,
	},
	list:$('.historyBg .historyList'),
	//初始化时读取历史记录
	/*init:function(){
		var datas=[];
		for(var i=0;i<10;i++){
			var data=localStorage.getItem('mapHistoryData'+i);
			if(data){
				data=JSON.parse(data);
				datas.push({
					name:data.type,
					sel:false
				});
			}else{
				break;
			}
		}
		if(datas.length===0){
			return;
		}
		
		edObj.historyData=datas;
		this.doListHtml();
		this.selectHistory(datas.length-1);
	},*/
	init:function(){
		var that=this;
		$('.submitHistory').on('click',function(){
			that.submitAll();
		});
	},
	clear:function(){
		this.list.children().remove();
	},
	//组合历史记录html
	doListHtml:function(){
		var selIdx=-1,
			hisAry=this.data.ary;
		for(var i=0;i<hisAry.length;i++){
			if(hisAry[i].sel){
				selIdx=i;
				break;
			}
		}
		var doHtml='';
		this.list.children('li').each(function(){
			$(this).remove();
		});
		for(var i=0;i<hisAry.length;i++){
			var posStyle='';
			if(i==selIdx){
				posStyle=' class="sel"';
			}
			if(i>selIdx){
				posStyle=' class="after"';
			}
			doHtml+='<li '+posStyle+' >'+hisAry[i].name+'</li>';
		}
		this.list.html(doHtml);
		var lis=this.list.children('li');
		var that=this;
		lis.on('click',function(){
			var from=that.getSelectIdx();
			var to=lis.index($(this));
			if(from===to){
				return;
			}
			that.selectHistory(from,to);
		});
	},
	//添加历史记录数据
	/*appendHistory:function(obj){
		return;//暂时屏蔽历史记录切换
		var tempData={};
		//tempData.name=this.names[name]?this.names[name]:'未收录动作';
		tempData.name=obj.name;
		tempData.sel=true;
		this.dataIdx++;
		var mapData={
			type:tempData.name,
			data:this.getMapData()
		}
		
		var oldSelIdx=-1;
		for(var i=0;i<edObj.historyData.length;i++){
			if(edObj.historyData[i].sel){
				oldSelIdx=i;
				break;
			}
		}
		if(oldSelIdx==edObj.historyData.length-1){//原历史记录为空或者选中项在最后
			edObj.historyData.forEach(function(item){
				item.sel=false;
			});
			
		}else if(oldSelIdx<edObj.historyData.length-1){//原来选中项不在最后时，删除选中项后的历史记录数据
			for(var i=edObj.historyData.length-1;i>-1;i--){
				edObj.historyData[i].sel=false;
				if(i>oldSelIdx){
					edObj.historyData.splice(i,1);
					localStorage.removeItem('mapHistoryData'+i);
				}
			}
		}
		edObj.historyData.push(tempData);
		var newSelIdx=edObj.historyData.indexOf(tempData);
		localStorage.setItem('mapHistoryData'+newSelIdx,JSON.stringify(mapData));
		//超过10个记录时，删除第一个数据
		if(newSelIdx==10){
			for(var i=0;i<10;i++){
				localStorage.setItem('mapHistoryData'+i,localStorage.getItem('mapHistoryData'+(i+1)));
			}
			localStorage.removeItem('mapHistoryData'+10);
			edObj.historyData.splice(0,1);
		}
		this.doListHtml();
		
	},*/
	a:function(cb){
		this.b(cb);
	},
	b:function(cb){
		this.c(cb)
	},
	c:function(cb){
		var a=1;
		cb(a);
	},
	appendHistory:function(obj){
		this.list.append($('<li >'+obj.name+'</li>'));
		if(obj.local&&obj.local.length>1){
			for(var i=0;i<obj.local.length;i++){
				if(obj.local[i].type=='delete'){
					obj.local[i].order=1;
				}
				if(obj.local[i].type=='add'){
					obj.local[i].order=2;
				}
				if(obj.local[i].type=='update'){
					obj.local[i].order=3;
				}
			}
			obj.local.sort(function(a,b){
				return a.order-b.order;
			});
		}
		
		var tempData={
			server:obj.server,
			local:obj.local,
			name:obj.name,
			sel:true
		};
		var oldIdx=this.getSelectIdx(),
			hisAry=this.data.ary;
		if(oldIdx==hisAry.length-1){//原历史记录为空或者选中项在最后
			hisAry.forEach(function(item){
				item.sel=false;
			});
		}else if(oldIdx<hisAry.length-1){//原来选中项不在最后时，删除选中项后的历史记录数据
			for(var i=hisAry.length-1;i>-1;i--){
				hisAry[i].sel=false;
				if(i>oldIdx){
					hisAry.splice(i,1);
					localStorage.removeItem('mapHistoryData'+i);
				}
			}
		}
		
		hisAry.push(tempData);
		var newIdx=hisAry.indexOf(tempData);
		
		if(newIdx==this.data.maxLen){
			this.submitFirst(function(){
				console.log('submitFirst end');
				console.log(new Date().valueOf());
			})
			/*var delHis=hisAry.splice(0,1)[0];
			if(delHis.server&&delHis.server.length>0){
				this.doServerActions({
					name:delHis.name,
					data:delHis.server,
					loading:true,
					callback:function(){
						console.log('cb',arguments);
					}
				});
			}*/
		}
		this.doListHtml();
	},
	submitAll:function(cb){
		if(this.data.ary.length>0){
			mapServerData.setLoading(true,'提交中...')
			var that=this;
			this.submitFirst(function(){
				that.doListHtml();
				that.submitAll();
			})
		}else{
			mapServerData.setLoading(true,'提交完毕');
			setTimeout(function(){
				mapServerData.setLoading(false);
				if(typeof cb=='function'){
					cb();
				}
			},500);
		}
	},
	submitFirst:function(callback){
		var hisAry=this.data.ary;
		var delHis=hisAry.splice(0,1)[0];
		var that=this;
		if(delHis.server&&delHis.server.length>0){
			this.maxSend=delHis.server.length;
			this.curSend=0;
			this.doServerActions({
				name:delHis.name,
				data:delHis.server,
				callback:function(num){
					if(num==that.maxSend){
						callback();
					}
				}
			});
		}else{
			callback();
		}
	},
	//执行服务数据提交动作
	doServerActions:function(obj){
		if(!obj.data){
			return;
		}
		var that=this;
		for(var i=0;i<obj.data.length;i++){
			if(obj.data[i].type.indexOf('Path')!=-1&&obj.data[i].search===false){
				obj.data[i]={
					type:'delPath',
					data:mapServerData.getDataFromNode('delPath',data.code)
				};
			}
			mapServerData.changeServer({
				type:obj.data[i].type,
				data:obj.data[i].data,
				callback:function(){
					if(typeof obj.callback=='function'){
						that.curSend++;
						obj.callback(that.curSend);
					}
				}
			})
			//this.serverAction({
			//	data:obj.data[i],
			//	callback:obj.callback
			//});
		}
	},
	/*serverAction:function(obj){
		if(!obj.data){
			return;
		}
		if(obj.data.type.indexOf('Path')!=-1&&obj.data.search===false){
			obj.data={
				type:'delPath',
				data:mapServerData.getDataFromNode('delPath',data.code)
			};
		}
		var that=this;
		mapServerData.changeServer({
			type:obj.data.type,
			data:obj.data.data,
			callback:function(){
				if(typeof obj.callback=='function'){
					that.curSend++;
					obj.callback(that.curSend);
				}
			}
		})
	},*/
	//获取选中序列号
	getSelectIdx:function(){
		var idx=-1,
			hisAry=this.data.ary;
		for(var i=0;i<hisAry.length;i++){
			if(hisAry[i].sel){
				idx=i;
				break;
			}
		}
		return idx;
	},
	//选中历史记录
	selectHistory:function(from,to){
		if(from==to){
			return;
		}
		mapDetails.clear();
		if(mapPath.selPt&&mapPath.selPt.length>0){
			for(var i=0;i<mapPath.selPt.length;i++){
				mapPath.updatePointStyle(mapPath.selPt[i],false)
			}
		}
		if(edObj.curNode&&edObj.curNode.length>0){
			for(var i=edObj.curNode.length-1;i>-1;i--){
				mapPolygon.selectNode(edObj.curNode[i],false);
			}
		}
		var lis=this.list.children('li');
		if(lis.length>0&&lis.eq(to).hasClass('sel')){
			return;
		}
		console.log('from:'+from+' to:'+to);
		lis.each(function(index){
			if(index<to){
				$(this).attr('class','');
			}
			if(index==to){
				$(this).attr('class','sel');
			}
			if(index>to){
				$(this).attr('class','after');
			}
		});
		this.data.ary.forEach(function(item,index){
			if(index==to){
				item.sel=true;
			}else{
				item.sel=false;
			}
		});
		
		this.doLocalAction(from,to);
	},
	doLocalAction:function(from,to){
		var increase=true;
		if(to-from<0){//确定增降序
			increase=false;
		}
		for(var i=from;increase?i<to+1:i>to;increase?i++:i--){
			var actAry=this.data.ary[i].local;
			console.log('do:'+i+',increase:'+increase);
			if(!actAry){
				continue;
			}
			for(var j=0;j<actAry.length;j++){
				this.localAction(increase,actAry[j]);
			}
		}
	},
	localAction:function(increase,data){
		//更新
		if(data.type=='update'){
			var from,to;
			if(increase){//判断正逆
				from=data.from;
				to=data.to;
			}else{
				from=data.to;
				to=data.from;
			}
			from=JSON.parse(from);
			to=JSON.parse(to);
			var pointID='';
			if(from.type=='polygon'){
				pointID=from.path.PointID;
			}else if(from.type=='path'){
				pointID=from.PointID;
			}else{
				return
			}
			var node=mapMath.getNodeFromIds([pointID])[0]
			if(!node||node.length<1){
				return;
			}
			if(from.type=='polygon'){
				var oData=to.oldData;
				var newArea=mapPolygon.append({
					points:oData.area.Area.split('|').map(function(item){
						var posAry=item.split(',');
						return {
							x:Math.round(posAry[0]),
							y:Math.round(posAry[1])
						};
					}),
					color:oData.area.Color,
					PointID:oData.point.PointID,
					pathPt:{x:Math.round(oData.point.X),y:Math.round(oData.point.Y)},
					pathLinks:to.path.links,
					oldData:to.oldData
				});
				mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(node));
				edObj.mapBg.removeChild(node);
				mapPath.updatePointStyle(newArea);
				var linkNodes=[];
				if(newArea.mapData.path.links&&newArea.mapData.path.links.length>0){
					linkNodes=mapMath.getNodeFromIds(newArea.mapData.path.links);
				}
				for(var i=0;i<linkNodes.length;i++){
					mapPath.updatePointStyle(linkNodes[i]);
				}
			}else if(from.type=='path'){
				var oData=to.oldData;
				var newPt=mapPath.appendPathPoint(
					{x:to.oldData.X,y:to.oldData.Y},
					[],
					to.PointID,
					to.oldData).node;
				newPt.mapData.links=to.links;
				mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(node));
				edObj.mapBg.removeChild(node);
				mapPath.updatePointStyle(newPt);
				var linkNodes=[];
				if(newPt.mapData.links&&newPt.mapData.links.length>0){
					linkNodes=mapMath.getNodeFromIds(newPt.mapData.links);
				}
				for(var i=0;i<linkNodes.length;i++){
					mapPath.updatePointStyle(linkNodes[i]);
				}
			}else{
				return
			}
		}
		//正加和逆减为增
		if((data.type=='add'&&increase)||(data.type=='delete'&&!increase)){
			var data=JSON.parse(data.data);
			var pointID='';
			if(data.type=='polygon'){
				pointID=data.path.PointID;
			}else if(data.type=='path'){
				pointID=data.PointID;
			}else{
				return
			}
			var oldNode=mapMath.getNodeFromIds([pointID])[0];
			if(data.type=='polygon'){
				var oData=data.oldData;
				var newArea=mapPolygon.append({
					points:oData.area.Area.split('|').map(function(item){
						var posAry=item.split(',');
						return {
							x:Math.round(posAry[0]),
							y:Math.round(posAry[1])
						};
					}),
					color:oData.area.Color,
					PointID:oData.point.PointID,
					pathPt:{x:Math.round(oData.point.X),y:Math.round(oData.point.Y)},
					pathLinks:data.path.links,
					oldData:data.oldData
				});
				if(oldNode){
					mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(oldNode));
					edObj.mapBg.removeChild(oldNode);
				}
				mapPath.updatePointStyle(newArea);
				var linkNodes=[];
				if(newArea.mapData.path.links&&newArea.mapData.path.links.length>0){
					linkNodes=mapMath.getNodeFromIds(newArea.mapData.path.links);
				}
				for(var i=0;i<linkNodes.length;i++){
					mapPath.updatePointStyle(linkNodes[i]);
				}
			}else if(data.type=='path'){
				var oData=data.oldData;
				var newPt=mapPath.appendPathPoint(
					{x:data.oldData.X,y:data.oldData.Y},
					[],
					data.PointID,
					data.oldData).node;
				newPt.mapData.links=data.links;
				if(oldNode){
					mapMath.moveAryItem(edObj.mapBg.children,edObj.mapBg.children.length-1,edObj.mapBg.children.indexOf(oldNode));
					edObj.mapBg.removeChild(oldNode);
				}
				mapPath.updatePointStyle(newPt);
				var linkNodes=[];
				if(newPt.mapData.links&&newPt.mapData.links.length>0){
					linkNodes=mapMath.getNodeFromIds(newPt.mapData.links);
				}
				for(var i=0;i<linkNodes.length;i++){
					mapPath.updatePointStyle(linkNodes[i]);
				}
			}else{
				return
			}
		}
		//正减和逆加为减
		if((data.type=='delete'&&increase)||(data.type=='add'&&!increase)){
			var data=JSON.parse(data.data);
			var pointID='';
			if(data.type=='polygon'){
				pointID=data.path.PointID;
			}else if(data.type=='path'){
				pointID=data.PointID;
			}else{
				return
			}
			var oldNode=mapMath.getNodeFromIds([pointID])[0];
			if(oldNode){
				edObj.mapBg.removeChild(oldNode);
			}else{
				return
			}
		}
	},
	replaceNodeFromMapData:function(){
		
	},
	/*selectHistory:function(idx){
		return;//暂时屏蔽历史记录切换
		var lis=this.list.children('li');
		if(lis.length>0&&lis.eq(idx).hasClass('sel')){
			return;
		}
		var data=localStorage.getItem('mapHistoryData'+idx);
		if(!data){
			showToast({
				title:'错误，历史记录数据丢失！'
			});
			return;
		}
		lis.each(function(index){
			if(index<idx){
				$(this).attr('class','');
			}
			if(index==idx){
				$(this).attr('class','sel');
			}
			if(index>idx){
				$(this).attr('class','after');
			}
		});
		edObj.historyData.forEach(function(item,index){
			if(index==idx){
				item.sel=true;
			}else{
				item.sel=false;
			}
		});
		var temp={};
		data=JSON.parse(data).data;
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
						obj.path.links=item.path.links.split('|').filter(function(item){
							return item!="";
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
		}*/
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
		/*if(data.paths&&data.paths.length>0){
			var paths=[];
			data.paths.forEach(function(item){
				var obj={
					x:item.x,
					y:item.y,
					PointID:item.PointID
				};
				if(item.links){
					obj.links=item.links.split('|').filter(function(item){
						return item!="";
					});
				}else{
					obj.links=[];
				}
				paths.push(obj);
			});
			temp.paths=paths;
		}
		//路径 end
		mapPath.selPt=[];
		edObj.curNode=[];
		rePaintMap(temp,'fromHistory');
	},*/
	//获取地图数据
	getMapData:function(){
		var temp={};
		for(var i=0;i<edObj.mapBg.children.length;i++){
			var mapData=edObj.mapBg.children[i].mapData;
			if(mapData){
				if(mapData.type=='polygon'){
					if(!temp.polygons){
						temp.polygons=[];
					}
					var obj={};
					obj.color=mapData.color.replace('0x','#');
					obj.areaId=mapData.areaId;
					obj.points=mapData.posData.points.map(function(item){
						return item.x+','+item.y;
					}).join('|');
					if(mapData.path){
						obj.path={
							PointID:mapData.path.PointID,
							x:mapData.path.x,
							y:mapData.path.y
						};
						if(mapData.path.links&&mapData.path.links.length>0){
							obj.path.links=mapData.path.links.map(function(item){return item;}).join('|');
						}else{
							obj.path.links='';
						}
						
					}
					if(mapData.label){
						obj.label=mapData.label;
					}
					if(mapData.logo){
						obj.logo=mapData.logo;
					}
					temp.polygons.push(obj);
				}
				/*if(mapData.type=='curve'){
					if(!temp.curves){
						temp.curves=[];
					}
					var obj={};
					obj.color=mapData.color.replace('0x','#');
					obj.points=mapData.posData.points.map(function(item){
						if(item.type=='normal'){
							return Math.round(item.x)+','+Math.round(item.y);
						}else if(item.type=='curve'){
							return Math.round(item.cp1.x)+','+Math.round(item.cp1.y)+' '+Math.round(item.cp2.x)+','+Math.round(item.cp2.y)+' '+Math.round(item.x)+','+Math.round(item.y);
						}
					}).join('|');
					if(mapData.label){
						obj.label=mapData.label;
					}
					if(mapData.logo){
						obj.logo=mapData.logo;
					}
					temp.curves.push(obj);
				}*/
				if(mapData.type=='path'){
					if(!temp.paths){
						temp.paths=[];
					}
					/*var linkNodes=mapPath.getPathPointFromIds(mapData.links);
					var links=[];
					linkNodes.forEach(function(item){
						links.push(Math.round(item.mapData.posData.x)+'_'+Math.round(item.mapData.posData.y)+'_'+item.mapData.uid);
					});*/
					temp.paths.push({
						x:Math.round(mapData.posData.x),
						y:Math.round(mapData.posData.y),
						PointID:mapData.PointID,
						links:mapData.links?mapData.links.map(function(item){return item}).join('|'):'',
					});
				}
			}
		}
		return temp;
	},
	//下一步
	goNext:function(){
		var lis=this.list.children('li');
		if(lis.length<1){
			return;
		}
		var selLi=this.list.children('li.sel'),
			idx=lis.index(selLi);
		if(idx==lis.length-1||idx==-1){
			return;
		}
		this.selectHistory(idx,idx+1);
	},
	//上一步
	goPrev:function(){
		var lis=this.list.children('li');
		if(lis.length<1){
			return;
		}
		var selLi=this.list.children('li.sel'),
			idx=lis.index(selLi);
		if(idx==0||idx==-1){
			return;
		}
		this.selectHistory(idx,idx-1);
	}
};