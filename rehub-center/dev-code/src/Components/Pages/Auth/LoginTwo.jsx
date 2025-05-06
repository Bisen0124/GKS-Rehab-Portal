import React, { Fragment } from "react";
import { Col, Container, Row } from "reactstrap";
import LoginForm from "./LoginForm";
import { Image } from '../../../AbstractElements';

const LoginTwo = () => {
    return (
        <Fragment>
            <section>
                <Container fluid={true}>
                    <Row>
                        <Col xl="5">
                            <Image attrImage={{ className: "bg-img-cover bg-center", src: `${require("../../../assets/images/login/3.jpg")}`, alt: "looginpage" }} />
                        </Col>
                        <Col xl="7 p-0" >
                            <LoginForm />
                        </Col>
                    </Row>
                </Container>
            </section>
        </Fragment>
    )
}

export default LoginTwo;