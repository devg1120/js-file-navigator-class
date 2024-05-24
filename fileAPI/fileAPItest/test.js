
//---ファイルを開く
var inp = document.querySelector("input[type='file']");
//inp.accept = ".txt,.json";
//inp.click();
inp.addEventListener("change",(event)=>{
    // このあとはevent.target.filesを使って別の処理へ...
    anyfunction(event.target);
});


function anyfunction( handle, file ) {

   console.log(file);

   // if (handle.kind == "file") {
   //     handle.getAsFileSystemHandle();
   // }

}

async function file_read( file ) {

  console.log("file_read------------------");
  console.log(file);
  var data = await file.text();
  console.log(data);

}
/*
//---ファイルを読み込む
var reader = new FileReader();
reader.onload = (event) => {
    //なにか処理...
}
//tmpfile はFile オブジェクト
reader.readAsText(tmpfile);

//---ファイルを保存する
var a = document.querySelector("a#hoge");
var data = {hoge:123, foo: "test!"};
var bb = new Blob([JSON.stringify(data)], {type: "application/json" });
var burl = URL.createObjectURL(bb);
a.href = burl;
a.download = "test.json";
a.click();

*/


/*********************************************************************/



async function filepicker() {
    if ("showOpenFilePicker" in window) {
        const fileoptions = {
            multiple : true, //複数のファイルを選択する場合
            excludeAcceptAllOption : false,  //使い道が見いだせないのでとりあえず無視

            types : [ //ファイルの種類のフィルター
                {
                    //ファイルの説明
                    description : "Application config file",  
                    //MIME typeと対象の拡張子
                    accept : {"application/json": [".json",".txt"]} 
                }
            ]

        };
        try {
            /**
             * @type {Array<FileSystemFileHandle>}
             */
            const fileHandles = await window.showOpenFilePicker(fileoptions);
            for (var handle of fileHandles) {
                console.log("ファイルの名前は",handle.name);
                console.log("ファイルの種類は",handle.kind); 
                //getFile()でFileオブジェクトを取得できる
                /**
                 * @type {File}
                 */
                var file = await handle.getFile();
                //ファイルを使った何か処理へ
                file_read( file );
            }
        }catch(e) {
            //ファイルが選択されなかった場合は例外が出力される
            alert("ファイルが選択されませんでした！");
        }
    }
}

document.querySelector("#file-select").addEventListener("click",(event)=>{
 filepicker();
});


//---ドラッグアンドドロップの場合
document.querySelector("#dropbox").addEventListener("drop",(event)=>{
    var items = event.dataTransfer.items;
    if (items[0].kind == "file") {
        items[0].getAsFileSystemHandle();
    }
});


// file:///C:/Users/devg1/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/iSEC/FTC%E8%A8%AD%E5%AE%9A.txt


//document.querySelector("#input-path").addEventListener("input",(event)=>{
//document.querySelector("#input-path").addEventListener("change",(event)=>{
//  console.log(event.target.value);
//});
async function file_read_from_path(path) {
   let dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
   console.log(dirHandle);
   if (dirHandle.kind == "directory") {
          let childDirHandle = await dirHandle.getDirectoryHandle('IX', { create: false })
          let fileHandle = await childDirHandle.getFileHandle('IX操作.txt', { create: false })
          let file = await fileHandle.getFile()
          file_read(file);

   } else {
      console.log("not directory:" + dirHandle.name);
   }
}

document.querySelector("#path-fix").addEventListener("click",(event)=>{

   let input = document.querySelector("#input-path");
   console.log(input.value);
   file_read_from_path(input.value);



});
