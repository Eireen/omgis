import { importAll } from './import';
import React from 'react';

const iconModules = importAll(require.context('./responsive-icons/', false, /\.js$/));

export function renderResponsiveIcon(componentName) {
    const componentModuleKey = `./${componentName}.js`;
    const Component = iconModules[componentModuleKey] && iconModules[componentModuleKey].default;
    if (!Component) {
        throw new Error(`Unknown component: ${componentName}`);
    }
    return <Component />;
}
