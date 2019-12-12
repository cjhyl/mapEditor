//地图相关的计算方法
var mapMath={
    //获取点到线段的距离、垂足、是否相交数据
    getDirFromPointToLine:function(point,linePoint1,linePoint2){
        var x=point.x,
            y=point.y,
            x1=linePoint1.x,
            y1=linePoint1.y,
            x2=linePoint2.x,
            y2=linePoint2.y,
            A=y2-y1,//一般式A变量
            B=x1-x2,//一般式B变量
            C=x2*y1-x1*y2,//一般式C变量
            d=Math.abs((A*x+B*y+C)/Math.sqrt(A*A+B*B)),//点到直线的距离
            crossX=(B*B*x-A*B*y-A*C)/(A*A+B*B),//垂足x
            crossY=(A*A*y-A*B*x-B*C)/(A*A+B*B);//垂足y
            
        //判断垂足是否在线段内
        var isInLine=this.isPointInLine({x:crossX,y:crossY},linePoint1,linePoint2);

        return {
            d:d,
            cross:{
                x:crossX,
                y:crossY
            },
            isInLine:isInLine
        };
    },
    //判断点是否在线段上
    isPointInLine:function(pt,linePt1,linePt2){
        var x=pt.x,
            y=pt.y,
            x1=linePt1.x,
            y1=linePt1.y,
            x2=linePt2.x,
            y2=linePt2.y;
        var isInLine=false;
        if((Math.min(x1,x2) <= x) && (x <= Math.max(x1,x2)) &&  (Math.min(y1,y2) <= y) && (y <= Math.max(y1,y2))){
            isInLine=true;
        }
        return isInLine;
    },
    //获取两条点的距离
    getDirFromPoint2:function(p1,p2){
    	return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
    },
    //获取两条线段ab和cd交点
    getPointFromLine2:function(a, b, c, d){ 

        var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); 

        var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x); 

        if ( area_abc*area_abd>=0 ) { 
            return false; 
        } 

        var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x); 

        var area_cdb = area_cda + area_abc - area_abd ; 
        if ( area_cda * area_cdb >= 0 ) { 
            return false; 
        }

        var t = area_cda / ( area_abd- area_abc ); 
        var dx= t*(b.x - a.x), 
            dy= t*(b.y - a.y); 
        return { x: a.x + dx , y: a.y + dy }; 
    },
    //判断一个点是否在多边形内部
    isInPolygon:function(pt, poly) {
    	for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) 
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) 
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) 
        && (c = !c); 
    	return c;
    },
    //判断一个点是否在矩形内部
    isInRect:function(pt,rect) {
        var isIn=false;
        if(pt.x>=rect.left&&pt.x<=rect.right&&pt.y>=rect.top&&pt.y<=rect.bottom){
        	isIn=true;
        }
        return isIn;
    },
    //根据获取弧形区域整体区域数据
    getRectFromCurveArys:function(pointsArys){
		if(!pointsArys||pointsArys.length<1||!pointsArys[0]||pointsArys[0].length<1){
			return null;
		}
		var rect={
			left:pointsArys[0][0].x,
			top:pointsArys[0][0].y,
			right:pointsArys[0][0].x,
			bottom:pointsArys[0][0].y,
			width:0,
			height:0
		};
		pointsArys.forEach(function(ary){
			ary.forEach(function(point){
				if(point.x<rect.left){
					rect.left=point.x;
				}
				if(point.y<rect.top){
					rect.top=point.y;
				}
				if(point.x>rect.right){
					rect.right=point.x;
				}
				if(point.y>rect.bottom){
					rect.bottom=point.y;
				}
			});
		});
		rect.width=rect.right-rect.left;
		rect.height=rect.bottom-rect.top;
		return rect;
	},
	getNodeFromIds:function(ids){
		var ptNodes=edObj.mapBg.children.filter(function(item){
			if(!item.mapData){
				return false;
			}
			if(item.mapData.type!='path'&&item.mapData.type!='polygon'){
				return false;
			}
			if(item.mapData.type=='path'&&ids.indexOf(item.mapData.PointID)==-1){
				return false
            }
            if(item.mapData.type=='polygon'&&ids.indexOf(item.mapData.path.PointID)==-1){
				return false
			}
			return true;
		});
		return ptNodes;
	},
	getPathPointData:function(node){
		var obj={};
		if(node.mapData.type=='polygon'){
			obj.PointID=node.mapData.path.PointID;
			obj.x=node.mapData.path.x;
			obj.y=node.mapData.path.y;
			obj.links=node.mapData.path.links;
		}
		if(node.mapData.type=='path'){
			obj.PointID=node.mapData.PointID;
			obj.x=node.mapData.posData.x;
			obj.y=node.mapData.posData.y;
			obj.links=node.mapData.links;
		}
		return obj;
	},
	getVertPoint:function(p1,p2){
		/*var x1=p1.x,
            y1=p1.y,
            x2=p2.x,
            y2=p2.y,
            A=y2-y1,//一般式A变量
            B=x1-x2,//一般式B变量
            C=x2*y1-x1*y2;//一般式C变量*/
		var dir=Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
		var pt={
			x:0,
			y:0
		};
			
	},
    //根据二维点位数组获取整体区域数据
    getRectFromPointsArys:function(pointsArys){
		if(!pointsArys||pointsArys.length<1||!pointsArys[0]||pointsArys[0].length<1){
			return null;
		}
		var rect={
			left:pointsArys[0][0].x,
			top:pointsArys[0][0].y,
			right:pointsArys[0][0].x,
			bottom:pointsArys[0][0].y,
			width:0,
			height:0
		};
		pointsArys.forEach(function(ary){
			ary.forEach(function(point){
				if(point.x<rect.left){
					rect.left=point.x;
				}
				if(point.y<rect.top){
					rect.top=point.y;
				}
				if(point.x>rect.right){
					rect.right=point.x;
				}
				if(point.y>rect.bottom){
					rect.bottom=point.y;
				}
			});
		});
		rect.width=rect.right-rect.left;
		rect.height=rect.bottom-rect.top;
		return rect;
	},
    //获取app中心对应的地图点坐标
    getMapPointInAppCenter:function(){
        //app元素中心点
        var rootCenter={
                cx:edObj.app.screen.width/2,
                cy:edObj.app.screen.height/2
        };
        //当前缩放倍数下 画板左上角坐标
        var mapPos={
            x:edObj.mapBg.position.x-edObj.mapBg.width/2,
            y:edObj.mapBg.position.y-edObj.mapBg.height/2,
        };
        var sc=edObj.mapBg.scale.x;
        //原始缩放倍数下的坐标
        var mapCenter={
            x:(rootCenter.cx-mapPos.x)/sc,
            y:(rootCenter.cy-mapPos.y)/sc
        }
        return mapCenter;
    },
    //获取app坐标对应的地图点坐标
    getMapPointInAppPos:function(pos){
        //当前缩放倍数下的 画板左上角坐标
        var mapPos={
            x:edObj.mapBg.position.x-edObj.mapBg.width/2,
            y:edObj.mapBg.position.y-edObj.mapBg.height/2,
        };
        var sc=edObj.mapBg.scale.x;
        //处理缩放
        var pointPos={
            x:(pos.x-mapPos.x)/sc,
            y:(pos.y-mapPos.y)/sc
        }
        //处理旋转
        var angel=edObj.mapBg.rotation;
        if(angel!==0){
            angel=-angel;
            var center={
                x:edObj.width/2,
                y:edObj.height/2
            };
            pointPos={
                x:(pointPos.x-center.x)*Math.cos(angel)-(pointPos.y-center.y)*Math.sin(angel)+center.x,
                y:(pointPos.y-center.y)*Math.cos(angel)+(pointPos.x-center.x)*Math.sin(angel)+center.y,
            }
        }
        return pointPos;
    },
    //已知圆心cPt、圆上一点pt和旋转角度angel 求旋转后点坐标
    pointArcMove:function(pt,cPt,angel){
    	return {
    		x:(pt.x-cPt.x)*Math.cos(angel)-(pt.y-cPt.y)*Math.sin(angel)+cPt.x,
			y:(pt.y-cPt.y)*Math.cos(angel)+(pt.x-cPt.x)*Math.sin(angel)+cPt.y,
    	};
    },
    //已知圆心cPt和圆上一点pt，求角度0-6.28
    getLineAngel:function(cPt,pt){
    	var dx=pt.x-cPt.x,
    		dy=pt.y-cPt.y;
    	if(dx==0&&dy==0){
    		return 0;
    	}
    	var angel=0;
    	if((dx>=0&&dy<=0)||(dx>=0&&dy>=0)){
    		angel=Math.PI/2+Math.atan((pt.y-cPt.y)/(pt.x-cPt.x));
    	}else if((dx<=0&&dy>=0)||(dx<=0&&dy<=0)){
    		angel=Math.PI+Math.PI/2+Math.atan((pt.y-cPt.y)/(pt.x-cPt.x));
    	}
    	return angel;
    },
    //移动数据元素位置 ary数组 startIdx起始位置 endIdx结束位置
	moveAryItem:function(ary,startIdx,endIdx){
        var moveItem=ary.splice(startIdx,1)[0];
        ary.splice(endIdx,0,moveItem);
	},
	//深度复制数组或对象
	copyObj:function(obj){
	    var str, newobj = obj.constructor === Array ? [] : {};
	    if(typeof obj !== 'object'){//不是对象
	        return;
	    } else if(window.JSON){
	        str = JSON.stringify(obj), //系列化对象
	        newobj = JSON.parse(str); //还原
	    } else {
	        for(var i in obj){
	            newobj[i] = typeof obj[i] === 'object' ? this.copyObj(obj[i]) : obj[i]; 
	        }
	    }
	    return newobj;
	},
	//获取url图片的base64编码
	getBase64FromUrl:function(imgUrl,callback){
		window.URL = window.URL || window.webkitURL;
		var xhr = new XMLHttpRequest();
		xhr.open("get", imgUrl, true);
		xhr.responseType = "blob";
		xhr.onload = function () {
			if (this.status == 200) {
				var blob = this.response;
				//console.log("blob", blob)
				var oFileReader = new FileReader();
				oFileReader.onloadend = function (e) {
					var base64 = e.target.result;
					//console.log("方式一》》》》》》》》》", base64)
					callback(base64)
				};
				oFileReader.readAsDataURL(blob);
			}
		}
		xhr.send();
	},
	//格式化时间错
	formatTimespan(sj){
		var now = new Date(sj);
		var year=now.getFullYear();
		var month=now.getMonth()+1;
		if(month<10){
			month='0'+month;
		}
		var date=now.getDate();
		var hour=now.getHours();
		var minute=now.getMinutes();
		var second=now.getSeconds();
		var end=sj%1000;
		if(end<100&&end>9){
			end='0'+end;
		}
		if(end<10){
			end='00'+end;
		}
		return   year+""+month+""+date+"-"+hour+":"+minute+":"+second+":"+end;
	}
}