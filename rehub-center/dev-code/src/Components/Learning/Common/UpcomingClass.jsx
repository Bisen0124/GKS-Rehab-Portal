import { BusinessAnalyst, CourseBy, UpcomingCourses, UXDevelopment, WebDevelopment } from '../../../Constant';
import { Btn, H5 } from '../../../AbstractElements';
import React, { Fragment, useState } from 'react';
import { Media, Col, Card, CardHeader, Collapse, CardBody } from 'reactstrap';

const UpcomingClass = () => {
    const [isDevelopment, setIsDevelopment] = useState(true);
    return (
        <Fragment>
            <Col xl="12">
                <Card>
                    <CardHeader>
                        <H5 attrH5={{ className: 'mb-0' }} >
                            <Btn attrBtn={{ className: 'btn btn-link ps-0', onClick: () => setIsDevelopment(!isDevelopment), color: 'transperant' }} >{UpcomingCourses}</Btn>
                        </H5>
                    </CardHeader>
                    <Collapse isOpen={isDevelopment}>
                        <CardBody className="upcoming-course">
                            <Media>
                                <Media body>
                                    <span className="f-w-600">{UXDevelopment}</span>
                                    <span className="d-block">{CourseBy}
                                        <a href="#javascript"> {'Development Team'}</a></span>
                                    <span className="d-block">
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star-half-o font-warning"></i>
                                    </span>
                                </Media>
                                <div>
                                    <h5 className="mb-0 font-primary">{'18'}</h5><span className="d-block">{'Dec'}</span>
                                </div>
                            </Media>
                            <Media>
                                <Media body>
                                    <span className="f-w-600">{BusinessAnalyst}</span>
                                    <span className="d-block">{CourseBy}
                                        <a href="#javascript">{'Analyst Team'} </a></span>
                                    <span className="d-block">
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                    </span>
                                </Media>
                                <div>
                                    <h5 className="mb-0 font-primary">{'28'}</h5>
                                    <span className="d-block">{'Dec'}</span>
                                </div>
                            </Media>
                            <Media>
                                <Media body><span className="f-w-600">{WebDevelopment}</span>
                                    <span className="d-block">{CourseBy}
                                        <a href="#javascript">{'Designer'} </a>
                                    </span>
                                    <span className="d-block">
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star font-warning"></i>
                                        <i className="fa fa-star-o font-warning"></i>
                                    </span>
                                </Media>
                                <div>
                                    <h5 className="mb-0 font-primary">{'5'}</h5><span className="d-block">{'Jan'}</span>
                                </div>
                            </Media>
                        </CardBody>
                        {/* </div> */}
                    </Collapse>
                </Card>
            </Col>
        </Fragment>
    );
};

export default UpcomingClass;