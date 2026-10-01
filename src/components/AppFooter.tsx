import React from 'react';
import { IonFooter, IonToolbar } from '@ionic/react';
import { environment } from '../environments/environment';

export const getAppFooterLabel = (): string => {
    const versionStr = environment.version
        ? (environment.version.startsWith('v') ? environment.version : `v${environment.version}`)
        : '';
    return `${environment.appName} ${versionStr}`.trim();
};

export const AppFooterText: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <div
        style={{
            height: '24px',
            lineHeight: '24px',
            fontSize: '12px',
            paddingRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%',
            color: '#6b7dba',
            ...style
        }}
    >
        {getAppFooterLabel()}
    </div>
);

export const AppFooter: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => {
    return (
        <IonFooter style={{ height: children ? undefined : '24px', ...style }}>
            <IonToolbar
                style={
                    children
                        ? undefined
                        : ({
                              '--min-height': '24px',
                              minHeight: '24px',
                              height: '24px'
                          } as React.CSSProperties)
                }
            >
                {children}
                {!children && <AppFooterText />}
            </IonToolbar>
        </IonFooter>
    );
};

export default AppFooter;
