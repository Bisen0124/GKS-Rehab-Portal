import React, { Fragment } from "react";
import { Col, Container, Row } from "reactstrap";
import LoginForm from "./LoginForm";
import { Image } from "../../../AbstractElements";

const LoginValidation = () => {
    return (
        <Fragment>
            <section>
                <Container fluid={true}>
                    <Row>
                        <Col xl="7 order-1">
                            <Image attrImage={{ className: "bg-img-cover bg-center", src: `${require("../../../assets/images/login/1.jpg")}`, alt: "looginpage" }} />
                        </Col>
                        <Col xl="5 p-0">
                            <LoginForm />
                        </Col>
                    </Row>
                </Container>
            </section>
        </Fragment>
    )
}

export default LoginValidation;