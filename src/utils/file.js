import { importAll } from './import';
import React from 'react';

const iconModules = importAll(require.context('../images/', false, /^\.\/file_.+\.svg$/));

/* Генерирует HTML SVG-иконки типа файла */
export function getIconComponent(fileUrl, imageUrl = null, width = 34, height = 34)
{
    const ext = fileUrl.substr(fileUrl.lastIndexOf('.') + 1).toLowerCase();

    if (imageUrl) {
        return <img src={imageUrl} className="file_type_icon" width={width} />;
    }

    // Типы файлов, для которых есть SVG-иконки
    const iconizedFileTypes = ['doc', 'docx', 'dwg', 'gif', 'jpg', 'ods', 'odt', 'pdf', 'png', 'ppt', 'rar', 'rtf', 'tgz', 'tiff', 'txt',
        'xls', 'xlsx', 'zip'];
    let iconCode;

    switch (ext) {
        case 'pptx':
            iconCode = 'ppt';
            break;
        case 'gz':
            iconCode = 'tgz';
            break;
        case 'jpeg':
            iconCode = 'jpg';
            break;
        case 'tif':
            iconCode = 'tiff';
            break;
        default:
            iconCode = ~iconizedFileTypes.indexOf(ext)
                ? ext
                : 'default';
    }

    return (
        <svg className={`file_type_icon ${iconCode}`} width={`${width}px`} height={`${height}px`}>
            <use xlinkHref={`#icn_file_${iconCode}`}></use>
        </svg>
    );
}
