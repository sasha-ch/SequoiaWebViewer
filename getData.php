<?
define('E_ERRORS_REPORTING', E_ERROR | E_PARSE | 	E_COMPILE_ERROR | E_RECOVERABLE_ERROR | E_USER_ERROR | E_CORE_ERROR);	//E_ALL
ini_set('error_reporting',  E_ERRORS_REPORTING);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('ignore_repeated_errors', 1);
ini_set('html_errors', 0);
ini_set('track_errors', 1);

ini_set('memory_limit', "512M");

function flog($msg = '')
{
	if(is_array($msg))
		$msg = print_r($msg, true);
	echo date("Y-m-d H:i:s") . "\t$msg\n";
}

function fillArrayWithFileNodes( $path, $sizeInBlocks )
{
	$data = array();
	$csize = 0;
	
	try{
		$dir = new DirectoryIterator( $path );
	}catch(Exception $e){
		flog ("$path : " . $e->getMessage());
		return array();
	}
	
	foreach ( $dir as $node ) {
		if( $node->isDot() || (!$node->isDir() && !$node->isFile()))	continue;		//или через getType()
		try{
			$inode = $node->getInode();
		}catch(Exception $e){
			flog ($node->getPathname() ." : " . $e->getMessage());
			continue;
		}
		$name = $node->getFilename();
		
		$line = array(
						'id' => $inode,
						'name' => $name,
					);
		
		if ( $node->isDir() ) {
			list($children, $size) = fillArrayWithFileNodes( $node->getPathname(), $sizeInBlocks );
			if(empty($children) || empty($size))		//папка пустая или у нас нет доступа
				continue;
			$line += array(
						'size' => $size,
						'children' => $children
					);
		} else if ( $node->isFile() ) {
			if($sizeInBlocks){
				$stat = stat($node->getPathname());					//медленно
				$size = $stat['blocks']*512;
			}else
				$size = $node->getSize();
			
			if($size == 0)	continue;		//игнорим пустые файлы
			
			$line += array(
							'size' => $size,
						);
		}
		$csize += $size;
		$data[] = $line;
	}
	return array($data, $csize);
}

ob_start();
set_time_limit(0);

$startTime = microtime(true);

if(php_sapi_name() == 'cli')
	$startpath = $argv[1];
else
	$startpath = $_REQUEST['path'];

$startpath = realpath($startpath);
$sizeInBlocks = (bool)$_REQUEST['blksize'];

list($r, $sz) = fillArrayWithFileNodes( $startpath, $sizeInBlocks );

$execTime = round(microtime(true)-$startTime, 2);

$ob = ob_get_clean();
$json = json_encode(array(	'id' => 'root', 
							'name' => $startpath, 
							'size' => $sz, 
							'children' => $r, 
							'errors' => $ob, 
							'exec' => $execTime
						)
					);

$cfn = str_replace('/','.',((strpos($startpath, '/') === 0) ? substr($startpath, 1) : $startpath)).".json";		//кеш
file_put_contents(dirname(__FILE__)."/cache/".$cfn, $json);
echo $json;
//echo memory_get_peak_usage(true);
?>