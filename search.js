const { resolve } = require("path");
const { readdir } = require("fs").promises;
const xlsxj = require("xlsx-to-json");
const json2xls = require("json2xls");
const moveFile = require("move-file");
const fs = require("fs");

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

getFileDirectory = async (file_to_search) => {
  for await (const f of getFiles("../Proyecto 1")) {
    //console.log("Looking  for: ", file_to_search,"in ", f);
    let file_type = f.split(".").pop();
    if (file_type == "jpg") {
      let file_name = f
        .split(/(\\|\/)/g)
        .pop()
        .split(".")[0];

      if (file_name.indexOf(file_to_search) != -1) {
        return {
          filter: file_to_search,
          path: f,
          file_name,
          file_type,
        };
      }
    }
  }
};

MoveFoundFile = async (file_path, file_name, type) => {
  await moveFile(file_path, `FinalDestination/${file_name}.${type}`);
  console.log("The file has been moved");
};

let final_json = [];
xlsxj(
  {
    input: "BASE_GT.xlsx",
    output: "output.json",
    sheet: "TOTAL AMPLIACION BO",
  },
  function (err, result) {
    if (err) {
      console.error(err);
    } else {
        console.log(result.length);
        
      result.forEach((element, index) => {
        getFileDirectory(element.UPC_NBR)
          .then((file) => {
            if (file) {
              //console.log(index,file);
              fs.copyFile(
                file.path,
                `./FinalDestination/${file.filter}.${file.file_type}`,
                (err) => {
                  if (err) throw err;
                  console.log("the file was copied ");
                
                //result = result;
                  final_json.push({
                    ...element,
                    path_in_system: file.path,
                    copied_path: `/FinalDestination/${file.filter}.${file.file_type}`,
                  });
                 
                }
              );
            }else{
                final_json.push({
                    ...element,
                    path_in_system: `N/A`,
                    copied_path: `N/A`,
                  });
            }
            if (index === result.length-1) {
                var xls = json2xls(final_json);
                fs.writeFileSync("new_data.xlsx", xls, "binary");
              }
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
  }
);
