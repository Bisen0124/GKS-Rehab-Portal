import { Dropzone, FileMosaic } from "@dropzone-ui/react";
import React, { Fragment, useState } from "react";
import { Form } from "reactstrap";

const DropzoneClass = ({maxFiles,accept}) => {
    const [files, setFiles] = useState([]);
    const updateFiles = (incomingFiles) => {
      setFiles(incomingFiles);
    };
    const removeFile = (id) => {
      setFiles(files.filter((x) => x.id !== id));
    };

  return (
    <Fragment>
      <Form className='m-b-20'>
        <div className='m-0 dz-message needsclick'>
        <Dropzone onChange={updateFiles} value={files} maxFiles={maxFiles} header={false} footer={false} minHeight='80px' label="Drag'n drop files here or click to Browse" accept={accept}>
        {files.map((file) => (
          <FileMosaic key={file.id} {...file} onDelete={removeFile} info={true} />
        ))}
      </Dropzone>
        </div>
      </Form>
    </Fragment>
  );
};

export default DropzoneClass;
