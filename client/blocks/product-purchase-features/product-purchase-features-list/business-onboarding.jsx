/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import PurchaseDetail from 'components/purchase-detail';

function trackOnboardingButtonClick() {
	analytics.tracks.recordEvent( 'calypso_plan_features_onboarding_click' );
}

export default localize( ( { translate } ) => {
	return (
		<div className="product-purchase-features-list__item">
			<PurchaseDetail
				icon="help"
				title={ translate( 'Get personalized help' ) }
				description={
					translate(
						'Schedule a one-on-one orientation with a Happiness Engineer ' +
						'to set up your site and learn more about WordPress.com.'
					)
				}
				buttonText={ translate( 'Schedule a session' ) }
				href={ 'https://calendly.com/wordpressdotcom/wordpress-com-business-site-setup/' }
				onClick={ trackOnboardingButtonClick }
			/>
		</div>
	);
} );
