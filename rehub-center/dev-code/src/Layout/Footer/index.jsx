import React, { Fragment } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Footer, P } from '../../AbstractElements';
import { useLocation } from 'react-router-dom';

import Translated from '../../Components/Translated';
import { useLang } from '../../contexts/LangContext';
import { getTranslation } from '../../utils/translator';

const FooterClass = () => {
  const { lang } = useLang();
  const location = useLocation();

  // Dynamic Academic Year (e.g. 2026-27)
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const academicYear = `${currentYear}-${nextYearShort}`;

  return (
    <Fragment>
      <Footer
        attrFooter={{
          className: `footer ${
            location.pathname === '/viho/page-layout/footer-dark'
              ? 'footer-dark'
              : location.pathname === '/viho/page-layout/footer-fixed'
              ? 'footer-fix'
              : ''
          }`,
        }}
      >
        <Container fluid={true}>
          <Row>
            <Col md="6" className="footer-copyright">
              <P attrPara={{ className: 'mb-0' }}>
                {getTranslation(
                  `Copyright ${academicYear} © Rehab All rights reserved./कॉपीराइट ${academicYear} © रिहैब। सभी अधिकार सुरक्षित हैं।`,
                  lang
                )}
              </P>
            </Col>

            <Col md="6">
              {/* <P attrPara={{ className: 'pull-right mb-0' }}>
                Hand crafted & made with <i className="fa fa-heart font-secondary"></i>
              </P> */}
            </Col>
          </Row>
        </Container>
      </Footer>
    </Fragment>
  );
};

export default FooterClass;