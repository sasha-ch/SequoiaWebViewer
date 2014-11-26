//переключатель событий
;(function($) {
	//append tail to element attr
	$.fn.toggleMyEvents = function(on) {
		var on = on || 0,
			that = this;
		
		if(on){
			that.bind('treemapmousemove', FileInfo.update)
				.bind('mouseleave', FileInfo.hide)
				.bind('click', FileInfo.hold)
				.unbind('dblclick')
				.bind('dblclick', FileInfo.zoomin);
		}else{
			that.unbind('treemapmousemove')
				.unbind('mouseleave')
				.unbind('click')
				//.unbind('dblclick')
				.bind('dblclick', FileInfo.unhold);
		}
		
		
		$( document ).on( 'keydown', function ( e ) {
			if ( e.keyCode === 27 ) { // ESC
				FileInfo.unhold(that);
			}
		});
		
		return that;
	};
})(jQuery);

//анимирует холст
var FileInfo = (function(){
	var updateHighlighter = function(e,data, that) {
	
		var bodyRect = data.nodes[0].geometry.body;
		
		var c = $(that).find("canvas")[1];
		var ctx=c.getContext("2d");
		ctx.clearRect(0, 0, c.width, c.height);
		//ctx.translate(0.5,0.5);
		ctx.strokeStyle="#FFFFFF";
		ctx.lineWidth=1;
		ctx.strokeRect(bodyRect[0]+0.5, bodyRect[1]+0.5, bodyRect[2], bodyRect[3]);
	};

	var updateMouseoverbox = function(e,data) {
		
		var node = data.nodes[0];
		var path = getPath(window.nodeData, node.id) + '/' + node.name;
		var dir_size = getParents(window.nodeData, node.id)[0]['size'];
		
		$("#mouseoverbox span#fname").html(path);
		$("#mouseoverbox span#fsize").html(formatSizeStr(node.size));
		$("#mouseoverbox span#dsize").html(formatSizeStr(dir_size));
		$("#mouseoverbox").show();
	};
	
	var funcs = {
		zoomin : function(e) {		//спускаемся на уровень вниз по дереву
			var node_id = $(this).attr('mouseover_node'),
				parents = getParents(window.nodeData, node_id);
			//clog(parents);
			//waitload.show();
			createTreemap(parents[(parents.length-2)]);
			//waitload.hide();
			e.stopPropagation();
		},
		
		hold : function(e) {
			//отключаем события. фиксируем данные о файле
			$(e.currentTarget).toggleMyEvents(0);
			e.stopPropagation();
		},

		unhold : function(that) {
			//включаем назад
			$(that).toggleMyEvents(1);
		},

		//вывод данных текущего файла
		update : function(e, data) {
			
			if (data.nodes[0] == undefined){ 			//элемент канваса неизвестен
				return;
			}
			
			if($(this).attr('mouseover_node') == data.nodes[0].id)	return;		//мы в пределах того же элемента
			
			$(this).attr('mouseover_node', data.nodes[0].id);
			
			updateHighlighter(e, data, this);
			updateMouseoverbox(e, data);
		},

		hide : function() {
			//$("#mouseoverbox").hide();
			$(this).attr('mouseover_node', '');
			
			var c = $(this).find("canvas")[1];
			var ctx=c.getContext("2d");
			ctx.clearRect(0, 0, c.width, c.height);
		}
	};
	return funcs;
})();

var waitload = {
	show: function(){$("#waitload").show();},
	hide: function(){$("#waitload").hide();}
};

function createTreemap(data){
	window.nodeData = data;
	
	$(box).empty();
	
	var treemap = $(box).treemap({
		"dimensions":[$(document).width()-$(box).offset().left-10,
						$(document).height()-$(box).offset().top-$('#mouseoverbox').outerHeight()-10],		//полный экран с отступом
		"sizeOption":0,
		"colorOption":0,
		"labelsEnabled":false,
		"animationEnabled":true,
		"animationDurationMs":200,
		"animationEasing":TreemapUtils.Easing["ease-in-out"], 
		"innerNodeHeaderHeightPx": 0,
		naColor: "#0000FF",
		squarifyType: 1,			//тип разметки поля
		gradientContrast: 0.5,
		"nodeData":data
	});
	treemap.toggleMyEvents(1);

	$(box).find("canvas").clone().addClass('layer2').appendTo(box);		//2й слой для подсветки
	$('#tsize').html(formatSizeStr(data.size));
	
};

function init(query) {
	var xhr = $.ajax({
		url: "getData.php?"+query,		//+"&t="+new Date().getTime(),
		dataType: 'json',
		type: 'GET',
		timeout: 300000,
		success: createTreemap,
		"error": function (XMLHttpRequest, textStatus, errorThrown) {
			console.log('Ajax Error');
			console.log(textStatus);
			console.log(errorThrown);
		},
		beforeSend:function(){
			waitload.show();
		},
		complete:function(){
			waitload.hide();
		}
	});
	//xhr.onreadystatechange = function() { alert(xhr.readyState); };	//$("#waitload").append
};

var box = "#treemap";

$(document).ready(function(){
	$('form[name="inform"]').submit(function(e){
		var str = $(this).serialize();
		init(str);   
		e.preventDefault();
	});
});
