var mapMoulde={
	uid:new Date().valueOf(),
	/*{
			name:'sanjiao',
			points:[{x:186,y:0},{x:0,y:299},{x:373,y:299}],
			color:'0xffffff',
			uid:123456789
		}*/
	data:[],//自定义模板数据
	init:function(){
		var mData=localStorage.getItem('mouldsData');
		if(!mData){
			return;
		}else{
			this.data=JSON.parse(mData);
			this.updateMouldHtml();
		}
	},
	//添加模板
	append:function(points,pos,color){
		var color=color||'0xffff00';
		if(pos.x>0&&pos.x<edObj.width&&pos.y>0&&pos.y<edObj.height){
			var rect=mapMath.getRectFromPointsArys([points]);
			points=points.map(function(item){
				return {
					x:pos.x+item.x-rect.width/2,
					y:pos.y+item.y-rect.height/2
				}
			});
			mapPolygon.append({
				points:points,
				color:color,
			});
			mapHistory.appendHistory({
				name:'模板'
			});
		}
	},
	//添加模板数据
	appendData:function(name){
		var isSame=false;
		for(var i=0;i<this.data.length;i++){
			if(this.data[i].name==name){
				showToast({
					title:'已有相同名称的模板'
				});
				return;
			}
		}
		
		var mapData=edObj.curNode[0].mapData;
		var pts=[];
		for(var i=0;i<mapData.posData.points.length;i++){
			pts.push({
				x:mapData.posData.points[i].x-mapData.posData.x,
				y:mapData.posData.points[i].y-mapData.posData.y,
			});
		}
		this.data.push({
			name:name,
			points:pts,
			color:mapData.color,
			uid:this.uid
		});
		this.uid++;
		this.updateMouldHtml();
	},
	//更新模板列表dom
	updateMouldHtml:function(){
		var list=$('.oper_mould .mouldList');
		var mouldHtml='';
		for(var i=0;i<this.data.length;i++){
			mouldHtml+='<li>'+
				'<input type="radio" name="clickMoulds" id="mould_'+this.data[i].uid+'" value="'+this.data[i].uid+'" />'+
				'<label for="mould_'+this.data[i].uid+'">'+this.data[i].name+'</label>'+
				'<button onclick="mapMoulde.clickDeleteMould(this)">删除</button>'+
			'</li>';
		}
		list.html(mouldHtml);
		localStorage.setItem('mouldsData',JSON.stringify(this.data));
	},
	//删除模板点击事件
	clickDeleteMould:function(ele){
		var that=this;
		showConfirm({
			title:'是否删除模板？',
			btns:['删除','取消'],
			callback:function(idx){
				if(idx===0){
					var id=$(ele).parent().find('input').val();
					for(var i=that.data.length-1;i>-1;i--){
						if(that.data[i].uid==id){
							that.data.splice(i,1);
							break;
						}
					}
					that.updateMouldHtml();
				}
			}
		});
	}
}