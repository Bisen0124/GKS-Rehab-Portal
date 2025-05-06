
import React, { Fragment, useState, useEffect } from 'react';
import { useContext } from 'react';
import { Maximize } from 'react-feather';
import { LI, UL, H6 } from '../../../AbstractElements';
import CustomizerContext from '../../../_helper/Customizer';
import Bookmarks from './Bookmark';
import LanguageClass from './Language';
import LogoutClass from './Logout';
import MessageDrop from './MessageDrop';
import MoonLight from './MoonLight';
import Notifications from './Notifiations';
import { MarginBottom } from '../../../Constant';

const Rightbar = () => {

     const [userName, setuserName] = useState('');

     useEffect(() => {
        setuserName(localStorage.getItem('Name'));
    }, [setuserName]);

    const { sidebarResponsive } = useContext(CustomizerContext);
    //full screen function
    function goFull() {
        if ((document.fullScreenElement && document.fullScreenElement !== null) ||
            (!document.mozFullScreen && !document.webkitIsFullScreen)) {
            if (document.documentElement.requestFullScreen) {
                document.documentElement.requestFullScreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullScreen) {
                document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

    return (
        <Fragment>
            <div className="nav-right col pull-right right-menu p-0">
                <UL attrUL={{ className: `simple-list d-flex flex-row nav-menus gap-5 align-center ${sidebarResponsive ? 'open' : ''}` }} >
                    {/* <LI><a className="text-dark" href="#javascript" onClick={goFull}>
                        <Maximize />
                    </a></LI> */}
                    {/* <LanguageClass /> */}
                    {/* <Bookmarks /> */}
                    {/* <Notifications /> */}
                    {/* <MoonLight /> */}
                    {/* <MessageDrop /> */}
                    <h6 style={{ marginBottom: '0px' }}>{userName}</h6>
                    <LogoutClass />
                </UL>
            </div>
        </Fragment >
    );
};

export default Rightbar;