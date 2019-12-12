var mapTopMenu={
	setDatas:{
		polygon:{
			borderWidth:1,
			borderColor:'000000',
			fillColor:'FFFFFF',
		},
		font:{
			size:16,
			color:'000000',
		},
		path:{
			nodeColor:'FFFFFF',
			pathWidth:2,
			pathColor:'000000',
			selectColor:'00FF00',
		},
		gravityRad:25,
		view:{
			showRuler:true,
			showOper:true,
			showLayout:true,
			showDetail:true,
			showHistory:true,
		}
	},
	setEles:{
		polygon:{
			fillColor:$('.colorBox.polygonFill'),
		},
		font:{
			size:$('.topMenu .settings input').eq(5),
			color:$('.topMenu .settings input').eq(1),
		},
		path:{
			nodeColor:$('.topMenu .settings input').eq(2),
			pathColor:$('.topMenu .settings input').eq(3),
			selectColor:$('.topMenu .settings input').eq(4),
		},
		gravityRad:$('.topMenu .settings input').eq(6),
		view:{
			showRuler:$('.topMenu .views input').eq(0),
			showOper:$('.topMenu .views input').eq(1),
			showLayout:$('.topMenu .views input').eq(2),
			showDetail:$('.topMenu .views input').eq(3),
			showHistory:$('.topMenu .views input').eq(4)
		}
	},
	init:function(){
		/*var setData=localStorage.getItem('topMenuSet')||this.setDatas;
		if(setData){
			if(typeof setData=="string"){
				setData=JSON.parse(setData);
				this.setDatas=setData;
			}
			
			var polygonSet=this.setEles.polygon;
			var polygonData=setData.polygon;
			polygonSet.fillColor.val(polygonData.fillColor);
			
			var fontSet=this.setEles.font;
			var fontData=setData.font;
			fontSet.size.val(fontData.size);
			fontSet.color.val(fontData.color);
			
			var pathSet=this.setEles.path;
			var pathData=setData.path;
			pathSet.nodeColor.val(pathData.nodeColor);
			pathSet.pathColor.val(pathData.pathColor);
			pathSet.selectColor.val(pathData.selectColor);
			
			this.setEles.gravityRad.val(setData.gravityRad);
			
			var viewSet=this.setEles.view;
			var viewData=setData.view;
			viewSet.showRuler.prop('checked',viewData.showRuler);
			viewSet.showOper.prop('checked',viewData.showOper);
			viewSet.showLayout.prop('checked',viewData.showLayout);
			viewSet.showDetail.prop('checked',viewData.showDetail);
			viewSet.showHistory.prop('checked',viewData.showHistory);
		}
		//更新取色插件颜色
		
		$('.topMenu .colorBox').each(function(){
			if(this.color&&this.color.importColor){
				this.color.importColor();
			}
		});*/
		this.bindEvent();
		this.updateSetDataToOther();
	},
	//获取当前设置数据
	getSetDatas:function(){
		var setDatas=this.setDatas;
		var polygonSet=this.setEles.polygon;
		setDatas.polygon.fillColor=polygonSet.fillColor.val();
		
		var fontSet=this.setEles.font;
		//setDatas.font.size=parseInt(fontSet.size.val())||0;
		//setDatas.font.color=fontSet.color.val();
		
		var pathSet=this.setEles.path;
		//setDatas.path.nodeColor=pathSet.nodeColor.val();
		//setDatas.path.pathColor=pathSet.pathColor.val();
		//setDatas.path.selectColor=pathSet.selectColor.val();
		
		//setDatas.gravityRad=parseInt(this.setEles.gravityRad.val())||0;
		
		var viewSet=this.setEles.view;
		//setDatas.view.showRuler=viewSet.showRuler.prop('checked');
		//setDatas.view.showOper=viewSet.showOper.prop('checked');
		//setDatas.view.showLayout=viewSet.showLayout.prop('checked');
		//setDatas.view.showDetail=viewSet.showDetail.prop('checked');
		//setDatas.view.showHistory=viewSet.showHistory.prop('checked');
		
		return setDatas;
	},
	bindEvent:function(){
		var that=this;
		$('body').on('click',function(e){
			$('.iconList').hide();
			if($(e.target).css('backgroundImage').indexOf('images/jscolor/cross.gif')!=-1){
				return;
			}
			$('.mainList ul').hide();
		})
		//顶部菜单点击弹出子菜单
		$('.mainList li').hover(function(e){
			if(e && e.stopPropagation){
		        e.stopPropagation();
		    }else{
		        window.event.cancelBubble = true;
		    }
		    $(this).siblings().children('ul').hide();
		    var ul=$(this).children('ul');
		    if(ul.css('display')=='none'){
		    	if(ul.hasClass('oper')){
		    		that.checkOper(ul);
		    	}
		    	ul.show();
		    }else{
		    	ul.hide();
		    }
		});
		$('.childList.oper li').click(function(e){
			that.checkOper($(this).parent());
		});
		$('.mainList li').click(function(e){
			if(e && e.stopPropagation){
		        e.stopPropagation();
		    }else{
		        window.event.cancelBubble = true;
		    }
		});
		//拖动条
		/*mySilder.init({
			ele:$('.topMenu .polygonOpacity'),
			callback:function(num){
				that.setDatasChange();
			}
		});*/
		//设置下的组件
		$('.topMenu .settings input').on('change',function(){
			that.setDatasChange();
		});
		//视窗下的组件
		$('.topMenu .views input').on('change',function(){
			that.setDatasChange();
		});
		//放到左侧操作栏的多边形颜色
		$('.colorBox.polygonFill').on('change',function(){
			that.setDatasChange();
		});
	},
	//检测操作菜单
	checkOper:function(ul){
		var lis=ul.find('li'),
			li_prev=lis.eq(0),
			li_next=lis.eq(1),
			li_copy=lis.eq(2),
			li_cut=lis.eq(3),
			li_paste=lis.eq(4),
			li_del=lis.eq(5),
			li_big=lis.eq(6),
			li_small=lis.eq(7);
		lis.addClass('gray');
		//上一步、下一步
		var historyList=$('.historyList li'),
			historySel=$('.historyList li.sel');
		if(historyList.length>1){
			var idx=historyList.index(historySel);
			if(idx<historyList.length-1){
				li_next.removeClass('gray');
			}
			if(idx>0){
				li_prev.removeClass('gray');
			}
		}
		//上一步、下一步end
		//复制、剪切
		if(edObj.curNode.length>0){
			li_copy.removeClass('gray');
			li_cut.removeClass('gray');
		}
		//复制、剪切end
		//粘贴
		if(edObj.copyData.datas&&edObj.copyData.datas.length>0){
			li_paste.removeClass('gray');
		}
		//粘贴end
		//删除
		if(edObj.curNode.length>0||mapPath.selPt.length>0){
			li_del.removeClass('gray');
		}
		//删除end
		//放大、缩小
		li_big.removeClass('gray');
		li_small.removeClass('gray');
		//放大、缩小end
	},
	//设置数据变化处理
	setDatasChange:function(){
		var data=this.getSetDatas();
		localStorage.setItem('topMenuSet',JSON.stringify(data));
		this.updateSetDataToOther();
	},
	//把设置数据更新到具体实施类中。
	updateSetDataToOther:function(){
		var setDatas=this.setDatas;
		mapPath.myStyle={
			nodeColor:'0x'+setDatas.path.nodeColor,
			pathWidth:2,
			pathColor:'0x'+setDatas.path.pathColor,
			selectColor:'0x'+setDatas.path.selectColor
		};
		mapPolygon.myStyle={
			borderWidth:setDatas.polygon.borderWidth,
			borderColor:'0x'+setDatas.polygon.borderColor,
			fillColor:'0x'+setDatas.polygon.fillColor
		};
		//this.viewVisibleChange();
	},
	//根据窗口菜单数据隐藏显示UI
	viewVisibleChange:function(){
		var viewData=this.setDatas.view,
			operBg=$('.operBg'),
			layoutBg=$('.layoutBg'),
			detailBg=$('.detailBg'),
			historyBg=$('.historyBg');
		if(viewData.showRuler){
			mapRuler.show();
		}else{
			mapRuler.hide();
		}
		
		if(viewData.showOper){
			operBg.show();
			mapRuler.vBg.css('left','74px');
		}else{
			operBg.hide();
			mapRuler.vBg.css('left',0);
		}
		
		if(viewData.showLayout){
			layoutBg.show();
		}else{
			layoutBg.hide();
		}
		
		if(viewData.showDetail){
			detailBg.show();
		}else{
			detailBg.hide();
		}
		
		if(viewData.showHistory){
			historyBg.show();
		}else{
			historyBg.hide();
		}
		
		if(viewData.showLayout&&viewData.showDetail&&viewData.showHistory){
			layoutBg.css({top:'0',height:'33%'});
			detailBg.css({top:'33%',height:'33%'});
			historyBg.css({top:'66%',height:'33%'});
		}
		if(viewData.showLayout&&!viewData.showDetail&&!viewData.showHistory){
			layoutBg.css({top:'0',height:'100%'});
		}
		if(!viewData.showLayout&&viewData.showDetail&&!viewData.showHistory){
			detailBg.css({top:'0',height:'100%'});
		}
		if(!viewData.showLayout&&!viewData.showDetail&&viewData.showHistory){
			historyBg.css({top:'0',height:'100%'});
		}
		if(viewData.showLayout&&viewData.showDetail&&!viewData.showHistory){
			layoutBg.css({top:'0',height:'50%'});
			detailBg.css({top:'50%',height:'50%'});
		}
		if(!viewData.showLayout&&viewData.showDetail&&viewData.showHistory){
			detailBg.css({top:'0',height:'50%'});
			historyBg.css({top:'50%',height:'50%'});
		}
		if(viewData.showLayout&&!viewData.showDetail&&viewData.showHistory){
			layoutBg.css({top:'0',height:'50%'});
			historyBg.css({top:'50%',height:'50%'});
		}
	},
	//导出文件
	exportMap:function(){
		showConfirm({
			title:"导出文件的格式?",
			btns:["txt","svg","取消"],
			callback:function(r){
				if(!edObj.mapBg||edObj.mapBg.children.length<1){
					alert('无地图数据');
					return;
				}
				var fileName=$('#exportFileName').val()?$('#exportFileName').val():'mapData'+new Date().valueOf();
				var exportType=$('input[name="exportType"]:checked').val();
				if(r===0){//导出txt
					var temp=mapHistory.getMapData();
					var blob = new Blob([JSON.stringify(temp)], { type: "text/plain;charset=utf-8" });
					FileSaver.saveAs(blob, fileName+".txt");
				}
				if(r===1){//导出svg
					console.log(mapHistory.getMapData());
					var temp=mapHistory.getMapData();
					var svgHtml='<?xml version="1.0" encoding="utf-8"?>';
					svgHtml+='<svg version="1.1" id="" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 '
					+edObj.width+' '+edObj.height+'" enable-background="new 0 0 '+edObj.width+' '+edObj.height+'" xml:space="preserve">';
					if(temp.polygons){
						for(var i=0;i<temp.polygons.length;i++){
							var color=temp.polygons[i].color;
							var points=temp.polygons[i].points.replace(/\|/g,' ');
							svgHtml+='<polygon uid="'+temp.polygons[i].uid+'" fill="'+color+'" points="'+points+'"';
							var path=temp.polygons[i].path;
							if(path){
								svgHtml+=' pathx="'+path.x+'" pathy="'+path.y+'" pathlinks="'+path.links+'"';
							}
							var label=temp.polygons[i].label;
							if(label){
								svgHtml+=' areaname="'+label.txt+'" fontsize="'+label.fontSize+'" fontweight="'+label.fontWeight+'" fontstyle="'+label.fontStyle+'" fontcolor="'+label.color+'" fontx="'+label.x+'" fonty="'+label.y+'"';
							}
							var logo=temp.polygons[i].logo;
							if(temp.polygons[i].logo){
								svgHtml+=' logourl="'+logo.url+'" logox="'+logo.x+'" logoy="'+logo.y+'" logoscale="'+logo.scale+'"';
							}
							svgHtml+='/>';
						}
					}
					/*if(temp.curves){
						for(var i=0;i<temp.curves.length;i++){
							var color=temp.curves[i].color;
							var points=temp.curves[i].points.split('|');
							svgHtml+='<path fill="'+color+'" d="M'+points[0];
							for(var j=1;j<points.length;j++){
								if(points[j].indexOf(' ')!=-1){
									svgHtml+='C'+points[j];
								}else{
									svgHtml+='L'+points[j];
								}
							}
							svgHtml+='z"';
							var label=temp.curves[i].label;
							if(label){
								svgHtml+=' areaname="'+label.txt+'" fontsize="'+label.fontSize+'" fontx="'+label.x+'" fonty="'+label.y+'"';
							}
							var logo=temp.curves[i].logo;
							if(temp.curves[i].logo){
								svgHtml+=' logourl="'+logo.url+'" logox="'+logo.x+'" logoy="'+logo.y+'" logow="'+logo.w+'" logoh="'+logo.h+'"';
							}
							svgHtml+='/>';
						}
					}*/
					if(temp.paths){
						for(var i=0;i<temp.paths.length;i++){
							var uid=temp.paths[i].uid;
							var links=temp.paths[i].links;
							svgHtml+='<circle uid="'+temp.paths[i].uid+'" links="'+links+'" cx="'+temp.paths[i].x+'" cy="'+temp.paths[i].y+'" r="10" stroke="#000000" stroke-width="2" fill="transparent" />';
							/*for(var j=0;j<links.length;j++){
								svgHtml+='<line x1="'+temp.paths[i].x+'" y1="'+temp.paths[i].y+'" x2="'+links[j].x+'" y2="'+links[j].y+'" style="stroke:#ffff00;stroke-width:1"/>';
							}*/
						}
					}
					svgHtml+='</svg>';
					var blob = new Blob([svgHtml], { type: "text/plain;charset=utf-8" });
					FileSaver.saveAs(blob, fileName+".svg");
				}
			}
		});
	},
	//删除
	delete:function(){
		if(edObj.curNode.length<1&&mapPath.selPt.length<1){
			return;
		}
		var selPt=[];
		for(var i=0;i<edObj.curNode.length;i++){
			var sPt=mapPolygon.editPoint.getSelPt(edObj.curNode[i]);
			if(sPt.length>0){
				selPt=selPt.concat(sPt);
			}
		}
		if(selPt.length>0){
			showConfirm({
				title:'是否删除这'+selPt.length+'个点？',
				btns:["删除","取消"],
				callback:function(r){
					if(r===0){
						var nodeParent=selPt[0].parent;
						var ltemp={};
						ltemp.type='update';
						ltemp.from=JSON.stringify(nodeParent.mapData);

						for(var i=0;i<selPt.length;i++){
							mapPolygon.editPoint.deletePoint(selPt[i]);
						}
						mapPolygon.updateOldData(nodeParent);
						mapDetails.showSelPolygon();//多边形详情

						ltemp.from=JSON.stringify(nodeParent.mapData);
						var local=[ltemp];
						var server=[{
							type:'updateArea',
							data:mapServerData.getDataFromNode('updateArea',nodeParent)
						}];
						mapHistory.appendHistory({
							name:'删除多边形点',
							server:server,
							local:local
						});
						//mapServerData.changeServer({//上传服务器数据
						//	type:'updateArea',
						//	data:mapServerData.getDataFromNode('updateArea',nodeParent)
						//});
					}
				}
			})
			return;
		}
		if(mapPolygon.editPoint.getSelPt)
		var title='是否删除这';
		if(edObj.curNode.length>0){
			title+=edObj.curNode.length+'块区域';
		}
		if(mapPath.selPt.length>0){
			if(edObj.curNode.length>0){
				title+='和';
			}
			title+=mapPath.selPt.length+'个路径点';
		}
		title+='？';
		showConfirm({
			title:title,
			btns:["删除","取消"],
			callback:function(r){
				if(r===0){
					var server=[],local=[];
					var phData=mapPath.deletePoint();
					var pyData=mapPolygon.delete();
					server=server.concat(phData.server);
					server=server.concat(pyData.server);
					local=local.concat(phData.local);
					local=local.concat(pyData.local);
					
					mapHistory.appendHistory({
						name:'删除',
						server:server,
						local:local
					});
				}
			}
		})
	},
	//多边形样式设置
	polygonStyleDlg:{
		data:[
			{checked:true,styleName:'样式1',typeId:'123456',borderWidth:'2',fillColor:'FFFFFF',borderColor:'000000',opacity:'0.9'}
		],
		dlg:null,
		shown:function(){
			var width=600,
				height=340,
				title="面元素样式",
				className="polygonStyleDlg",
				tableHeight=height-33-33,
				addGridWidth=width/6-1;
				
			var myHtml='<div class="stylesBg">'+
				'<div class="tableBg" style="height:'+(height-33-33)+'px">'+
					'<table style="width:100%">'+
						'<tr>'+
							'<th></th><th>样式名</th><th>类型id</th><th>边线宽度</th><th>填充颜色</th><th>边线颜色</th><th>透明度</th>'+
						'</tr>'+
					'</table>'+
				'</div>'+
				'<div class="btnsBg">'+
					'<div class="addBg">'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="styleName" type="text" placeholder="样式名" />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="typeId" type="text" placeholder="类型id" />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="borderWidth" type="text" placeholder="边线宽度"  />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="fillColor" class="colorBox" type="text" placeholder="填充颜色"  />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="borderColor" class="colorBox" type="text" placeholder="边线颜色"  />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="opacity" type="text" placeholder="透明度"  />'+
						'</div>'+
					'</div>'+
					'<button class="btn create">新建</button>'+
					'<button class="btn ok">确定</button>'+
				'</div>'+
			'</div>';
			var that=this;
			var dlg=createDialog({
				width:width,
				height:height,
				title:title,
				className:className,
				contentHtml:myHtml,
				onClose:function(){
					that.dlg=null;
				}
			});
			this.dlg=dlg;
			this.tableChangeEvent();
			var createBtn=dlg.find('.btn.create'),
				okBtn=dlg.find('.btn.ok'),
				table=dlg.find('table'),
				addBg=dlg.find('.addBg');
			if(this.data.length>0){
				for(var i=0;i<this.data.length;i++){
					this.append(this.data[i]);
				}
			}
			jscolor.init();
			createBtn.on('click',function(){
				if(addBg.css('display')=='none'){
					addBg.show();
				}else{
					addBg.hide();
				}
			});
			okBtn.on('click',function(){
				if(addBg.css('display')=='none'){
					return;
				}
				var addData=that.getAddData();
				if(!addData){
					showToast({title:'请把数据全部填写！'});
					return;
				}else{
					that.append(addData);
					that.data.push(addData);
					jscolor.init();
					addBg.hide();
				}
			});
		},
		append:function(data){
			var table=this.dlg.find('table');
			var trHtml='<tr>'+
				'<td>'+
					'<input data-key="checked" type="checkbox" '+(data.checked?'checked="checked"':'')+' />'+
				'</td>'+
				'<td>'+
					'<input data-key="styleName" type="text" value="'+data.styleName+'" />'+
				'</td>'+
				'<td>'+data.typeId+'</td>'+
				'<td>'+
					'<input data-key="borderWidth" type="text" value="'+data.borderWidth+'"  />'+
				'</td>'+
				'<td>'+
					'<input data-key="fillColor" class="colorBox" type="text" value="'+data.fillColor+'"  />'+
				'</td>'+
				'<td>'+
					'<input data-key="borderColor" class="colorBox" type="text" value="'+data.borderColor+'"  />'+
				'</td>'+
				'<td>'+
					'<input data-key="opacity" type="text" value="'+data.opacity+'"  />'+
				'</td>'+
			'</tr>';
			table.append($(trHtml));
			this.tableChangeEvent();
		},
		getAddData:function(){
			var addDatas={
				checked:false
			};
			var keyName=['styleName','typeId','borderWidth','fillColor','borderColor','opacity'];
			var inputs=this.dlg.find('.addBg input');
			var isAnyEmpty=false;
			for(var i=0;i<inputs.length;i++){
				var val=inputs.eq(i).val();
				if(val!==''){
					addDatas[keyName[i]]=val;
				}else{
					isAnyEmpty=true;
					break;
				}
			}
			if(isAnyEmpty){
				return false;
			}else{
				for(var i=0;i<inputs.length;i++){
					if(inputs.eq(i).hasClass('colorBox')){
						inputs.eq(i).val('FFFFFF');
						inputs.eq(i).get(0).color.importColor();
					}else{
						inputs.eq(i).val('');
					}
				}
				return addDatas;
			}
		},
		tableChangeEvent:function(){
			var that=this;
			this.dlg.find('table input').off('change').on('change',function(){
				that.tableChange(this);
			})
		},
		tableChange:function(ele){
			var trs=this.dlg.find('table tr'),
				thisTr=$(ele).parent().parent(),
				idx=trs.index(thisTr)-1,
				keyName=$(ele).attr('data-key');
			this.data[idx][keyName]=$(ele).val();
		}
	},
	//字体样式设置
	fontStyleDlg:{
		data:[
			{checked:true,styleName:'样式1',typeId:'222',fontSize:'12',fontColor:'FFFFFF',icon:'images/logos/escalator.png'}
		],
		dlg:null,
		shown:function(){
			var width=600,
				height=340,
				title="标注样式",
				className="fontStyleDlg",
				tableHeight=height-33-33,
				addGridWidth=width/5-1;
				
			var myHtml='<div class="stylesBg">'+
				'<div class="tableBg" style="height:'+(height-33-33)+'px">'+
					'<table style="width:100%">'+
						'<tr>'+
							'<th></th><th>样式名</th><th>类型id</th><th>字体大小</th><th>字体颜色</th><th>图标</th>'+
						'</tr>'+
					'</table>'+
				'</div>'+
				'<div class="btnsBg">'+
					'<div class="addBg">'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="styleName" type="text" placeholder="样式名" />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="typeId" type="text" placeholder="类型id" />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="fontSize" type="text" placeholder="字体大小"  />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<input data-key="fontColor" class="colorBox" type="text" placeholder="字体颜色"  />'+
						'</div>'+
						'<div class="grid" style="width:'+addGridWidth+'px;">'+
							'<img class="iconImage" />'+
							'<input data-key="icon" type="hidden" placeholder="图标"  />'+
						'</div>'+
					'</div>'+
					'<button class="btn create">新建</button>'+
					'<button class="btn ok">确定</button>'+
				'</div>'+
			'</div>';
			var that=this;
			var dlg=createDialog({
				width:width,
				height:height,
				title:title,
				className:className,
				contentHtml:myHtml,
				onClose:function(){
					that.dlg=null;
				}
			});
			this.dlg=dlg;
			this.imageEvent();
			this.tableChangeEvent();
			var createBtn=dlg.find('.btn.create'),
				okBtn=dlg.find('.btn.ok'),
				table=dlg.find('table'),
				addBg=dlg.find('.addBg');
			if(this.data.length>0){
				for(var i=0;i<this.data.length;i++){
					this.append(this.data[i]);
				}
			}
			jscolor.init();
			createBtn.on('click',function(){
				if(addBg.css('display')=='none'){
					addBg.show();
				}else{
					addBg.hide();
				}
			});
			okBtn.on('click',function(){
				if(addBg.css('display')=='none'){
					return;
				}
				var addData=that.getAddData();
				if(!addData){
					showToast({title:'请把数据全部填写！'});
					return;
				}else{
					that.append(addData);
					that.data.push(addData);
					jscolor.init();
					addBg.hide();
				}
			});
		},
		append:function(data){
			var table=this.dlg.find('table');
			var trHtml='<tr>'+
				'<td>'+
					'<input data-key="checked" type="checkbox" '+(data.checked?'checked="checked"':'')+' />'+
				'</td>'+
				'<td>'+
					'<input data-key="styleName" type="text" value="'+data.styleName+'" />'+
				'</td>'+
				'<td>'+data.typeId+'</td>'+
				'<td>'+
					'<input data-key="fontSize" type="text" value="'+data.fontSize+'"  />'+
				'</td>'+
				'<td>'+
					'<input data-key="fontColor" class="colorBox" type="text" value="'+data.fontColor+'"  />'+
				'</td>'+
				'<td>'+
					'<img class="iconImage" src="'+data.icon+'"/>'+
					'<input data-key="icon" type="hidden" value="'+data.icon+'" />'+
				'</td>'+
			'</tr>';
			table.append($(trHtml));
			this.tableChangeEvent();
			this.imageEvent();
		},
		imageEvent:function(){
			var that=this;
			var images=this.dlg.find('.iconImage');
			images.off('click').on('click',function(e){
				e.stopPropagation();
				var ele=this;
				mapTopMenu.iconListShow(ele,function(src){
					ele.src=src;
					$(ele).next().val(src);
					if($(ele).parent().is('td')){
						that.tableChange($(ele).next().get(0));
					}
				});
			});
			
		},
		getAddData:function(){
			var addDatas={
				checked:false
			};
			var keyName=['styleName','typeId','fontSize','fontColor','icon'];
			var inputs=this.dlg.find('.addBg input');
			var isAnyEmpty=false;
			for(var i=0;i<inputs.length;i++){
				var val=inputs.eq(i).val();
				if(val!==''){
					addDatas[keyName[i]]=val;
				}else{
					isAnyEmpty=true;
					break;
				}
			}
			if(isAnyEmpty){
				return false;
			}else{
				for(var i=0;i<inputs.length;i++){
					if(inputs.eq(i).hasClass('colorBox')){
						inputs.eq(i).val('FFFFFF');
						inputs.eq(i).get(0).color.importColor();
					}else if(inputs.eq(i).hasClass('icon')){
						inputs.prev().attr('src','');
						inputs.eq(i).val('');
					}else{
						inputs.eq(i).val('');
					}
				}
				return addDatas;
			}
		},
		tableChangeEvent:function(){
			var that=this;
			this.dlg.find('table input').off('change').on('change',function(){
				that.tableChange(this);
			})
		},
		tableChange:function(ele){
			var trs=this.dlg.find('table tr'),
				thisTr=$(ele).parent().parent(),
				idx=trs.index(thisTr)-1,
				keyName=$(ele).attr('data-key');
			this.data[idx][keyName]=$(ele).val();
		}
	},
	iconListShow:function(ele,callback){
		var wH=$('body').height(),
			posE=$(ele).offset(),
			hE=$(ele).height(),
			list=$('.iconList'),
			hL=list.height();
		console.log(posE,hE,wH);
		list.show();
		list.css('left',posE.left+'px');
		if(posE.top+hE+hL>wH){
			list.css('top',posE.top-hL);
		}else{
			list.css('top',posE.top+hE);
		}
		list.children('img').off('click').on('click',function(e){
			if(typeof callback=='function'){
				callback(this.src);
			}
		});
	}
}