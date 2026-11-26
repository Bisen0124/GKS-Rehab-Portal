import React, { Fragment, useContext } from 'react';
import { AlignCenter } from 'react-feather';
import { Link } from 'react-router-dom';
import CheckContext from '../../_helper/Customizer';

//Logo
import logo from "../../../src/assets/images/GKS/gks-logo1.webp";

const Leftbar = () => {

    const { mixLayout, toggleSidebar, toggleIcon, toggleSidebarResponsive } = useContext(CheckContext);

    const openCloseSidebar = () => {
        const nextClosed = !toggleIcon;
        toggleSidebar(nextClosed);
        if (!nextClosed && toggleSidebarResponsive) {
            toggleSidebarResponsive(false);
        }
    };

    return (
        <Fragment>
            <div className="main-header-left">
                {mixLayout ?
                    <div className="logo-wrapper">
                        <Link to={`${process.env.PUBLIC_URL}/dashboard/Home`}>
                            {/* <Image attrImage={{ className: 'img-fluid d-inline', src: `${require('../../assets/images/logo/logo.png')}`, alt: '' }} /> */}
                            {/* <p>Drug de-addiction center</p> */}
                            <img src={logo} alt="Logo" className='dashboard__logo mx-auto d-flex'/>
                        </Link>
                    </div>
                    :
                    <div className="dark-logo-wrapper">
                        <Link to={`${process.env.PUBLIC_URL}/dashboard/Home`}>
                            {/* <Image attrImage={{ className: 'img-fluid d-inline', src: `${require('../../assets/images/logo/dark-logo.png')}`, alt: '' }} /> */}
                            <p>Drug de-addiction center</p>
                        </Link>
                    </div>
                }
                <div className="toggle-sidebar" onClick={() => openCloseSidebar()}>
                    <AlignCenter className="status_toggle middle" id="sidebar-toggle" />
                </div>
            </div>
        </Fragment >
    );
};

export default Leftbar;