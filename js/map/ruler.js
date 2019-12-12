//标尺
var mapRuler={
	vBg:$('.vertRuler'),//纵向尺标元素jq对象
	hBg:$('.horzRuler'),//横向尺标元素jq对象
	splitData:[//缩放倍数与分割间隔对应数据
		{scale:0.1,split:800},
		{scale:0.2,split:400},
		{scale:0.4,split:200},
		{scale:0.8,split:100},
		{scale:1.2,split:50},
		{scale:2.0,split:50},
		{scale:4.0,split:50},
		{scale:5.0,split:50}
	],
	//在地图缩放、移动时更新尺标
	change:function(){
		if(!edObj.showRuler){
			return;
		}
		
		var rData=this.getRulerData();//尺标数据获取
		
		this.hBg.css({
			'left':rData.horz.startPos+'px',
			'width':rData.horz.width+'px'
		});
		this.vBg.css({
			'top':rData.vert.startPos+'px',
			'height':rData.vert.height+'px'
		});
		//根据数据绘制尺标
		this.paintRuler('horz',rData.horz);
		this.paintRuler('vert',rData.vert);
	},
	//绘制尺标 type:横向horz纵向vert data:传入的纵向或横向数据
	paintRuler:function(type,data){
		var scale=Math.round(edObj.mapBg.scale.x*100);
		var split=0;
		for(var i=0;i<this.splitData.length;i++){
			var scale_cur=Math.round(this.splitData[i].scale*100);
			var scale_next=Math.round(this.splitData[i+1].scale*100);
			if(scale>=scale_cur&&scale<scale_next){
				split=this.splitData[i].split;
				break;
			}
		}
		if(split==0){
			return;
		}
		var listW=split*edObj.mapBg.scale.x;
		var splitAry=[];
		splitAry.push(parseInt(data.startNum/split)*split);
		for(var i=data.startNum;i<=data.endNum;i+=split){
			splitAry.push(parseInt(i/split)*split+split);
		}
		splitAry=splitAry.map(function(item){
			return {
				pos:(item-data.startNum)*edObj.mapBg.scale.x,
				num:item
			}
		});
		var doHtml='<ul class="list">';
		var st='top';
		if(type=='horz'){
			st='left';
		}
		for(var i=0;i<splitAry.length;i++){
			doHtml+='<li style="'+st+':'+splitAry[i].pos+'px" data-type="'+type+'" data-status="normal"><div class="line"></div><div class="txt">'+splitAry[i].num+'</div>';
			if(i<splitAry.length-1){
				var dif=(splitAry[i+1].pos-splitAry[i].pos)/10;
				for(var j=1;j<10;j++){
					doHtml+='<div style="'+st+':'+(dif*j)+'px" class="line2"></div>';
				}
			}
			doHtml+='</li>';
		}
		doHtml+='</ul>';
		var bg=this.vBg;
		if(type=='horz'){
			bg=this.hBg;
			
		}
		bg.children().each(function(){
			$(this).remove();
		});
		bg.append($(doHtml));
	},
	//获取尺标数据
	getRulerData:function(){
		var mapBg=edObj.mapBg,
			app=edObj.app,
			data={
				scX:mapBg.x-mapBg.width/2,
				scY:mapBg.y-mapBg.height/2,
				scW:mapBg.width,
				scH:mapBg.height,
				scale:{
					x:mapBg.scale.x,
					y:mapBg.scale.y
				},
				mapW:edObj.height,
				mapH:edObj.height,
				rootW:app.screen.width,
				rootH:app.screen.height
			};
		var ruler={
			vert:{},
			horz:{}
		};
		//横向数据获取
		if(data.scX<0){
			ruler.horz.startPos=0;
			ruler.horz.startNum=-data.scX/data.scale.x;
		}else{
			ruler.horz.startPos=data.scX;
			ruler.horz.startNum=0;
		}
		if(data.scX+data.scW>data.rootW){
			ruler.horz.endPos=data.rootW;
		}else{
			ruler.horz.endPos=data.scX+data.scW;
		}
		ruler.horz.width=ruler.horz.endPos-ruler.horz.startPos;
		ruler.horz.endNum=ruler.horz.width/data.scale.x+ruler.horz.startNum;
		//横向数据获取 end
		//纵向数据获取
		if(data.scY<0){
			ruler.vert.startPos=0;
			ruler.vert.startNum=-data.scY/data.scale.y;
		}else{
			ruler.vert.startPos=data.scY;
			ruler.vert.startNum=0;
		}
		if(data.scY+data.scH>data.rootH){
			ruler.vert.endPos=data.rootH;
		}else{
			ruler.vert.endPos=data.scY+data.scH;
		}
		ruler.vert.height=ruler.vert.endPos-ruler.vert.startPos;
		ruler.vert.endNum=ruler.vert.height/data.scale.y+ruler.vert.startNum;
		//纵向数据获取 end
		
		return ruler;
	},
	//点击时 显示/隐藏 延长线
	showLine:function(ele){
		ele=$(ele);
		var status=ele.attr('data-status');
		if(status=='normal'){
			ele.find('.line').addClass('out');
			ele.attr('data-status','out');
		}else{
			ele.find('.line').removeClass('out');
			ele.attr('data-status','normal');
		}
	},
	//隐藏尺标
	hide:function(){
		edObj.showRuler=false;
		this.hBg.hide();
		this.vBg.hide();
	},
	//显示尺标
	show:function(){
		edObj.showRuler=true;
		this.hBg.show();
		this.vBg.show();
	}
}
