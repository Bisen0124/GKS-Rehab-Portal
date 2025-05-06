import React, { Fragment, useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import Tour from 'reactour';
import { Breadcrumbs } from '../../../AbstractElements';
import UserProfile from './UserProfile';
import PostSecond from './PostSecond';
import PostThird from './PostThird';
import LeftbarProfile from './Leftbar';
import PostFirst from './PostFirst';

const steps = [
  {
    selector: '.step1',
    content: 'This is Profile image',
  },
  {
    selector: '.step2',
    content: 'Change Profile image here',
  },
  {
    selector: '.step3',
    content: 'This is your Social details',
  },
  {
    selector: '.step4',
    content: 'This is your Your detail',
  },
  {
    selector: '.step5',
    content: 'This is the your first Post',
  },
  {
    selector: '.step6',
    content: 'This is the your Last Post'
  }
];

const Tours = () => {
  const [opentour, setopentour] = useState(true);
  const closeTour = () => {
    setopentour(false);
  };
  const disableBody = target => disableBodyScroll(target);
  const enableBody = target => enableBodyScroll(target);

  return (
    <Fragment>
      <Breadcrumbs mainTitle="Tour" parent="Bouns Ui" title="Tour" />
      <Tour
        steps={steps}
        rounded={5}
        isOpen={opentour}
        disableInteraction={true}
        disableKeyboardNavigation={false}
        onRequestClose={closeTour}
        onAfterOpen={disableBody}
        onBeforeClose={enableBody}
      />
      <Container fluid={true}>
        <div className="user-profile">
          <Row>
            {/* <!-- user profile header start--> */}
            <UserProfile step={steps} />
            {/* <!-- user profile header end--> */}
            <div className="col-xl-3 col-lg-12 col-md-5 xl-35">
            <LeftbarProfile colClass="col-xl-12 col-lg-6 col-md-12 col-sm-6" /></div>
            <Col xl="9" lg="12" md="7" className="xl-65">
              <Row>
                {/* <!-- profile post start--> */}
                <PostFirst />
                {/* <!-- profile post end-->
                <!-- profile post start--> */}
                <PostSecond />
                {/* <!-- profile post end   -->
                <!-- profile post start--> */}
                <PostThird />
                {/* <!-- profile post end --> */}
              </Row>
            </Col>
            {/* <!-- user profile fifth-style end--> */}
            {/* <UserProfileStyle /> */}
          </Row>
        </div>
      </Container>
    </Fragment>

  );
};

export default Tours;