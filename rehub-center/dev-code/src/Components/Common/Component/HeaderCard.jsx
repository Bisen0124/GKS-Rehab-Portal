import { H5 } from '../../../AbstractElements';
import React, { Fragment } from 'react';
import { CardHeader } from 'reactstrap';

const HeaderCard = ({ title, span1, span2, className = ' ' }) => {
    return (
        <Fragment>
            <CardHeader className={`pb-0 header-card-heading ${className}`}>
                <H5 className="header-card-title">{title}</H5>
                {span1 ? <span>{span1}</span> : ''}
                {span2 ? <span>{span2}</span> : ''}
            </CardHeader>
        </Fragment>
    );
};

export default HeaderCard;