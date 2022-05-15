import React, { useRef, useState } from 'react';
import { initializeWidget, useActiveViewId, useDatasheet, useFields, FieldType } from '@vikadata/widget-sdk';
import { Button } from '@vikadata/components';
import { IParseBookMark, parseBookmark, ParseStatus } from './utils';

export const HelloWorld: React.FC = () => {
  const inputRef = useRef<any>();
  const [importError, setImportError] = useState<string>();
  const datasheet = useDatasheet();
  const viewId = useActiveViewId();
  const fields = useFields(viewId);
  const selectFile = () => {
    inputRef.current.click?.()
  }
  const inputChange = (e) => {
    const [file] = e.target.files;
    if (!file) {
      console.log('未选择文件')
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (e) => {
      const content = e.target?.result;
      importBookmark(content as any)
    }
  }
  const importBookmark = (content: string) => {
    const res = parseBookmark(content);
    if (res.error) {
      switch(res.status) {
        case ParseStatus.NotBookmark: setImportError('请导入chrome书签文件'); break;
        default: setImportError('未知错误'); break;
      }
    }
    writeBookmark(res.data || []);
  }

  const validateFields = fields.some(field => field.type === FieldType.SingleText) && 
    fields.some(field => field.type === FieldType.URL) && 
    fields.some(field => field.type === FieldType.DateTime)

  const writeBookmark = (data: IParseBookMark[]) => {
    // 校验字段，必须包含 单行文本、url、date
    const titleFieldId = fields.find(field => field.type === FieldType.SingleText)!.id;
    const urlFieldId = fields.find(field => field.type === FieldType.URL)!.id;
    const dateTimeFieldId = fields.find(field => field.type === FieldType.DateTime)!.id;
    const selectFieldId = fields.find(field => field.id !== titleFieldId && field.type === FieldType.SingleText)!.id;
    const writeList = data.map(item => {
      return {
        valuesMap: {
          [titleFieldId]: item.title,
          [dateTimeFieldId]: item.createTime,
          [urlFieldId]: item.url,
          [selectFieldId]: item.type
        }
      }
    })
    const permission = datasheet?.checkPermissionsForAddRecords(writeList);
    if (permission && !permission.acceptable) {
      setImportError(permission.message)
      return;
    }
    datasheet?.addRecords(writeList);
  }

  const error = !validateFields ? '当前表字段不满足条件，必须包含（文本、网址、日期、单选）字段' : importError;
  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {
        error &&
        <div style={{ position: 'absolute', width: '100%', color: 'red', top: '0', fontSize: '12px', background: 'antiquewhite', padding: '0 5px' }}>
          {error}
        </div>
      }
      <div style={{
        position: 'relative',
        display: 'flex',
      }}>
        <input ref={inputRef} style={{ display: 'none' }} type="file" multiple={false} onChange={inputChange}></input>
        <Button color="primary" onClick={() => selectFile()} disabled={Boolean(error)}> 导入书签文件 </Button>
      </div>
    </div>
  );
};

initializeWidget(HelloWorld, process.env.WIDGET_PACKAGE_ID);
