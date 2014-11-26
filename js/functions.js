function clog(msg){
	//$('#debug').append('[' + (typeof msg) + '] : ' + msg+'<br>');
	console.log(msg);
}

/**
 * Convert number of bytes into human readable format
 *
 * @param integer bytes     Number of bytes to convert
 * @param integer precision Number of digits after the decimal separator
 * @return string
 */
function bytesToSize(bytes, precision)
{   
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
    
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
 
    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
 
    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
 
    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
 
    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
 
    } else {
        return bytes + ' B';
    }
}


//вид строки с размером файла
function formatSizeStr(size){
	return bytesToSize(size, 1) + " ("+size+")";
}

//полный путь к файлу
/*var getPath = function (subTree, id) {
	if (!subTree) 
		return;
		
	if (subTree.id == id) {
		return subTree.name;
	}
	if(typeof subTree.children !== 'undefined'){
		for (var i = 0; i < subTree.children.length; i++) {
			
			var found = getPath(subTree.children[i], id);
			if (found) return ((subTree.id != 'root') ? subTree.name : '.') + '/' + found;
		}
	}else{
		return;
	}
	
};*/

//цепочка родительских папок
var getParents = function (subTree, id) {
	if (!subTree) 
		return;
	
	if (subTree.id == id) {		//искомый элемент
		return -1;
	}
	if(typeof subTree.children !== 'undefined'){
		for (var i = 0; i < subTree.children.length; i++) {
			
			var found = getParents(subTree.children[i], id);
			if (found === -1) return [subTree];
			else if (found){
				found.push(subTree);
				return found;
			}
		}
	}else{
		return false;
	}

};

//полный путь к файлу
var getPath = function (subTree, id) {
	var chain = getParents(subTree, id)
		names = [];
	for(var i=0; i<chain.length; i++){
		names[i] = (chain[i].id == 'root') ? '.' : chain[i].name;
	}
	return names.reverse().join('/');
}