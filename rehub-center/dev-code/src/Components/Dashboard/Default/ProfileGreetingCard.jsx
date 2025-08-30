import { Btn, H3, P } from '../../../AbstractElements';
import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Card, CardBody, CardHeader } from 'reactstrap';
import { Link } from 'react-router-dom';


const ProfileGreeting = () => {
      const [userName, setUserName] = useState('');

       useEffect(() => {
          setUserName(localStorage.getItem('Name') || '');
    
        }, []);
    return (
        <Fragment>
            {/* <Card className="profile-greeting"> */}
            <Card className="">
                {/* <CardHeader className="pb-0"></CardHeader> */}
                <CardBody className="text-center p-4">
                    <H3 attrH3={{ className: 'font-bold' }} >Wellcome Back, {userName}</H3>
                    {/* <P>Welcome to the viho Family!we are glad that you are visite this dashboard.we will be happy to help you grow your business.</P> */}
                    {/* <Link to={`${process.env.PUBLIC_URL}/app/users/userProfile`} ><Btn attrBtn={{ as: Card.Header, className: 'btn btn-light mt-3', color: 'default' }} >Check Profile</Btn></Link> */}

                    <Btn attrBtn={{ as: Card.Header, className: 'btn btn-primary-light btn btn-default mt-3', color: 'default' }} >Check Profile</Btn>
                </CardBody>
                <div className="confetti">
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                </div>
            </Card>
        </Fragment>
    );
};

export default ProfileGreeting;